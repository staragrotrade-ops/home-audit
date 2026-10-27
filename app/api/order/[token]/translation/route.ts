import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jobIdForToken } from '@/lib/access-tokens'
import { expireOpenSessions, isPayable, loadOrder } from '@/lib/orders'
import { getStripe } from '@/lib/stripe-server'
import { isSameOriginMutation, readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { TRANSLATION_FEE_CENTS } from '@/lib/translation'

export const runtime = 'nodejs'

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

// Adds or removes the Chinese translation before payment (price changes).
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!isSameOriginMutation(request)) return reply({ error: 'Invalid request.' }, 403)
  const supabase = getSupabaseAdmin()
  if (!supabase) return reply({ error: 'Unavailable.' }, 503)
  try {
    const { on } = z.object({ on: z.boolean() }).parse(await readJsonBody(request, 200))
    const { token } = await context.params
    const jobId = await jobIdForToken(supabase, token)
    const job = jobId ? await loadOrder(supabase, jobId) : null
    if (!job) return reply({ error: 'This link has expired.' }, 404)
    if (!isPayable(job) || job.intake_channel === 'report_transfer') {
      return reply({ error: 'The translation can only be changed before payment.' }, 409)
    }
    // An open payment page would still have the old price: close it first.
    const stripe = getStripe()
    if (stripe) {
      const open = await expireOpenSessions(supabase, stripe, job.id)
      if (open !== 'clear') return reply({ error: 'A payment is already in progress. Refresh the page.' }, 409)
    }
    const { data, error } = await supabase.rpc('set_order_translation', {
      p_job_id: job.id,
      p_on: on,
      p_fee: TRANSLATION_FEE_CENTS / 100,
    })
    if (error) return reply({ error: error.message }, 409)
    return reply({ ok: true, ...(data as object) })
  } catch {
    return reply({ error: 'Could not change the translation.' }, 400)
  }
}
