import { NextResponse } from 'next/server'
import { jobIdForToken } from '@/lib/access-tokens'
import { storeFloorplan } from '@/lib/floorplan'
import { loadOrder } from '@/lib/orders'
import { clientHash, isSameOriginMutation } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const maxDuration = 30

// Hosting caps request bodies at about 4.5 MB; keep a margin.
const CUSTOMER_MAX_BYTES = 4 * 1024 * 1024
const CUSTOMER_MAX_PLANS = 4

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

// The customer adds the floorplan (usually from the listing) after paying.
// Optional: the inspector can also capture one onsite.
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!isSameOriginMutation(request)) return reply({ error: 'Invalid request.' }, 403)
  const supabase = getSupabaseAdmin()
  if (!supabase) return reply({ error: 'Unavailable.' }, 503)

  const { data: allowed } = await supabase.rpc('consume_rate_limit', {
    p_bucket: 'order_floorplan',
    p_client_hash: clientHash(request, 'order_floorplan'),
    p_window_seconds: 3600,
    p_max_hits: 12,
  })
  if (allowed === false) return reply({ error: 'Too many uploads. Please email the floorplan instead.' }, 429)

  try {
    const { token } = await context.params
    const jobId = await jobIdForToken(supabase, token)
    const job = jobId ? await loadOrder(supabase, jobId) : null
    if (!job) return reply({ error: 'This link has expired.' }, 404)
    if (job.payment_status !== 'paid') return reply({ error: 'Payment has not been received yet.' }, 409)

    const { count } = await supabase
      .from('job_floorplans')
      .select('id', { count: 'exact', head: true })
      .eq('job_id', job.id)
      .eq('source', 'customer')
      .eq('status', 'active')
    if ((count || 0) >= CUSTOMER_MAX_PLANS) {
      return reply({ error: 'We already have your floorplans. Email us if one needs replacing.' }, 409)
    }

    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || !file.size) return reply({ error: 'Choose the floorplan file.' }, 400)
    if (file.size > CUSTOMER_MAX_BYTES) {
      return reply({ error: 'That file is over 4 MB. A screenshot of the floorplan works well.' }, 400)
    }
    const floorplan = await storeFloorplan(supabase, {
      jobId: job.id,
      bytes: new Uint8Array(await file.arrayBuffer()),
      source: 'customer',
      levelLabel: String(form.get('level') || ''),
    })
    return reply({ ok: true, floorplan: { levelLabel: floorplan.level_label } }, 201)
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Upload failed.' }, 400)
  }
}
