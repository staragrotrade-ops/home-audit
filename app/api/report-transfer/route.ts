import { NextResponse } from 'next/server'
import { z } from 'zod'
import { issueOrderToken, orderUrl } from '@/lib/access-tokens'
import { isTransferCode } from '@/lib/report-transfer'
import { clientHash, isSameOriginMutation, readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const schema = z.object({
  code: z.string().refine(isTransferCode),
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.email().max(160),
  mobile: z.string().trim().regex(/^[0-9 +()-]{8,20}$/),
  website: z.string().max(200).optional(),
})

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

// A buyer asks for a transferred report: creates their order (not paid yet)
// and returns their order page, where they accept the agreement and pay.
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return reply({ error: 'Invalid request.' }, 403)
  const supabase = getSupabaseAdmin()
  if (!supabase) return reply({ error: 'Unavailable.' }, 503)
  try {
    const input = schema.parse(await readJsonBody(request, 4_000))
    if (input.website) return reply({ ok: true, url: '/' })
    const { data: allowed } = await supabase.rpc('consume_rate_limit', {
      p_bucket: 'report_transfer',
      p_client_hash: clientHash(request, 'report_transfer'),
      p_window_seconds: 3600,
      p_max_hits: 6,
    })
    if (allowed === false) return reply({ error: 'Too many requests. Please email us.' }, 429)

    const { data, error } = await supabase.rpc('create_transfer_job', {
      p_code: input.code,
      p_customer: {
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        mobile: input.mobile,
      },
    })
    if (error) return reply({ error: error.message }, 409)
    const row = (Array.isArray(data) ? data[0] : data) as { job_id: string } | null
    if (!row) return reply({ error: 'Could not start the order.' }, 500)
    const token = await issueOrderToken(supabase, row.job_id)
    return reply({ ok: true, url: orderUrl(token) })
  } catch (error) {
    if (error instanceof z.ZodError) return reply({ error: 'Please check your details.' }, 400)
    return reply({ error: 'Could not start the order.' }, 500)
  }
}
