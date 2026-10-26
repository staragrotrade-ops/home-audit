// Server-only. Sends the current report to the customer: an email with a
// link to their order page, where they download the PDF (each download is
// counted). A link is used rather than an attachment: reports with photos
// are often too large for email, and the page always has the latest version.
import type { SupabaseClient } from '@supabase/supabase-js'
import { issueOrderToken, orderUrl } from '@/lib/access-tokens'
import { jobAddress, loadJobContact } from '@/lib/admin-jobs'
import { markTest, sendEmail, type EmailMessage } from '@/lib/email'
import { CONTACT_EMAIL, SITE_URL } from '@/lib/site'

export type SentReport = {
  id: string
  version_label: string
  issued_at: string
}

export function reportReadyEmail(input: {
  to: string
  firstName: string
  address: string
  reference: string
  url: string
  version: string
  resend: boolean
}): EmailMessage {
  const updated = input.resend || input.version !== 'v1'
  return {
    to: input.to,
    subject: `${updated ? 'Updated inspection report' : 'Your inspection report'} – ${input.address}`,
    text: `Hi ${input.firstName},

${updated ? `An updated version (${input.version}) of the` : 'The'} inspection report for ${input.address} (reference ${input.reference}) is ready.

View and download the report (PDF):
${input.url}

Start with the Summary page: it lists any major defects and safety hazards, the repairs grouped by trade and any further inspections we recommend. Defect numbers match the marks on the floorplans.

If anything is unclear, reply to this email before you sign a contract or let a cooling-off, finance or building condition date pass. Up to 15 minutes of discussion with the inspector is included.

The link stays open for 180 days; please save a copy of the PDF.

Home Audit
${CONTACT_EMAIL}
${SITE_URL}`,
  }
}

/** The current issued report of a job (latest version), or null. */
export async function currentReport(supabase: SupabaseClient, jobId: string) {
  const { data } = await supabase
    .from('inspection_reports')
    .select('id,version_label,issued_at,sent_at,status')
    .eq('job_id', jobId)
    .eq('status', 'issued')
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as (SentReport & { sent_at: string | null }) | null
}

export async function sendReportToCustomer(
  supabase: SupabaseClient,
  jobId: string,
  staffId: string | null,
) {
  const job = await loadJobContact(supabase, jobId)
  const customer = job.customer_snapshot || {}
  if (!customer.email) throw new Error('The customer has no email address.')
  if (job.payment_status !== 'paid') {
    throw new Error('Payment has not been received. The report is sent once the order is paid.')
  }
  const report = await currentReport(supabase, jobId)
  if (!report) throw new Error('No issued report yet. Issue the report from the app first.')

  const token = await issueOrderToken(supabase, jobId)
  const message = reportReadyEmail({
    to: customer.email,
    firstName: customer.first_name || 'there',
    address: jobAddress(job) || 'your property',
    reference: job.public_reference,
    url: `${orderUrl(token)}#report`,
    version: report.version_label,
    resend: Boolean(report.sent_at),
  })
  const result = await sendEmail(markTest(message, job.is_test), {
    supabase,
    jobId,
    templateKey: 'report_ready',
  })
  if (!result.sent) throw new Error(result.reason)

  const { error } = await supabase.rpc('mark_report_sent', {
    p_report_id: report.id,
    p_sent_to: customer.email,
    p_staff_id: staffId,
  })
  if (error) throw new Error(error.message)
  return { reportId: report.id, version: report.version_label, sentTo: customer.email }
}
