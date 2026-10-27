import { NextResponse } from 'next/server'
import { jobIdForToken } from '@/lib/access-tokens'
import { loadOrder } from '@/lib/orders'
import { REPORT_BUCKET } from '@/lib/reports'
import { DOWNLOAD_COOKIE, hasAccess } from '@/lib/report-download'
import { clientHash } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function reply(message: string, status: number) {
  return new NextResponse(message, {
    status,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

// The customer's download: the current report, once it has been sent to them
// and the order is paid. Opens through a short-lived signed link.
export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  const supabase = getSupabaseAdmin()
  if (!supabase) return reply('Unavailable.', 503)

  const { data: allowed } = await supabase.rpc('consume_rate_limit', {
    p_bucket: 'order_report',
    p_client_hash: clientHash(request, 'order_report'),
    p_window_seconds: 3600,
    p_max_hits: 60,
  })
  if (allowed === false) return reply('Too many downloads. Please try again later.', 429)

  const { token } = await context.params
  const jobId = await jobIdForToken(supabase, token)
  const job = jobId ? await loadOrder(supabase, jobId) : null
  if (!job) return reply('This link has expired. Please email us for a new one.', 404)
  if (job.payment_status !== 'paid') return reply('The report is available once the order is paid.', 409)
  // The emailed code must have been confirmed in this browser.
  const cookie = request.headers
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DOWNLOAD_COOKIE}=`))
    ?.slice(DOWNLOAD_COOKIE.length + 1)
  if (!hasAccess(cookie ? decodeURIComponent(cookie) : undefined, job.id)) {
    return NextResponse.redirect(new URL(`/order/${token}#report`, request.url), 303)
  }

  const { data: report } = await supabase
    .from('inspection_reports')
    .select('id,storage_path,zh_path')
    .eq('job_id', job.id)
    .eq('status', 'issued')
    .not('sent_at', 'is', null)
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!report) return reply('The report is not ready yet.', 404)
  const chinese = new URL(request.url).searchParams.get('lang') === 'zh'
  if (chinese && !report.zh_path) return reply('The Chinese translation is not ready yet.', 404)
  const path = chinese ? (report.zh_path as string) : (report.storage_path as string)

  const { data, error } = await supabase.storage
    .from(REPORT_BUCKET)
    .createSignedUrl(path, 300, {
      download: `Home-Audit-report-${job.public_reference}${chinese ? '-zh' : ''}.pdf`,
    })
  if (error || !data) return reply('Unable to open the report. Please try again.', 500)
  await supabase.rpc('record_report_download', { p_report_id: report.id })
  return NextResponse.redirect(data.signedUrl, 303)
}
