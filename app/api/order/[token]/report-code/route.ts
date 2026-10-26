import { NextResponse } from 'next/server'
import { jobIdForToken } from '@/lib/access-tokens'
import { sendEmail } from '@/lib/email'
import { addressOf, loadOrder } from '@/lib/orders'
import { codeHash, downloadCodeEmail, maskEmail, newDownloadCode } from '@/lib/report-download'
import { clientHash, isSameOriginMutation } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

// Emails a 6-digit code to the order's own email address (never to an
// address typed in), so only the customer can open the report.
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!isSameOriginMutation(request)) return reply({ error: 'Invalid request.' }, 403)
  const supabase = getSupabaseAdmin()
  if (!supabase) return reply({ error: 'Unavailable.' }, 503)

  const { token } = await context.params
  const jobId = await jobIdForToken(supabase, token)
  const job = jobId ? await loadOrder(supabase, jobId) : null
  if (!job) return reply({ error: 'This link has expired.' }, 404)
  if (job.payment_status !== 'paid') return reply({ error: 'The report is available once the order is paid.' }, 409)
  const email = job.customer_snapshot?.email
  if (!email) return reply({ error: 'There is no email address on this order. Please contact us.' }, 409)

  for (const [bucket, hash, max] of [
    ['report_code_job', `job:${job.id}`, 5],
    ['report_code_ip', clientHash(request, 'report_code'), 10],
  ] as const) {
    const { data: allowed } = await supabase.rpc('consume_rate_limit', {
      p_bucket: bucket,
      p_client_hash: hash,
      p_window_seconds: 3600,
      p_max_hits: max,
    })
    if (allowed === false) return reply({ error: 'Too many codes requested. Please try again in an hour.' }, 429)
  }

  const code = newDownloadCode()
  const { error } = await supabase
    .from('report_download_codes')
    .insert({ job_id: job.id, code_hash: codeHash(job.id, code), sent_to: email })
  if (error) return reply({ error: 'Could not create a code.' }, 500)
  const result = await sendEmail(downloadCodeEmail({ to: email, code, address: addressOf(job) }), {
    supabase,
    jobId: job.id,
    templateKey: 'report_download_code',
  })
  if (!result.sent) return reply({ error: 'The code could not be emailed. Please contact us.' }, 502)
  return reply({ ok: true, sentTo: maskEmail(email) })
}
