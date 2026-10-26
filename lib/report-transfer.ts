// Server-only. Report transfer: an agent passes on a QR code / link; another
// buyer pays and receives the same report in their own name.
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { issueOrderToken, orderUrl } from '@/lib/access-tokens'
import { markTest, ownerEmail, sendEmail, type EmailMessage } from '@/lib/email'
import { REPORT_BUCKET } from '@/lib/reports'
import { nameSlots, stampReport } from '@/lib/report-stamp'
import { CONTACT_EMAIL, SITE_URL } from '@/lib/site'

export const TRANSFER_PRICE_CENTS = 27500
export const TRANSFER_DAYS = 30

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'

export function newTransferCode() {
  const bytes = randomBytes(10)
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('')
}

export function transferUrl(code: string) {
  return `${SITE_URL}/r/${code}`
}

export function isTransferCode(code: string) {
  return /^[A-Za-z0-9]{10}$/.test(code)
}

export function melbourneDate(iso: string) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function transferNote(name: string, transferredAt: string, inspectedAt: string) {
  return `Report transferred to ${name} on ${melbourneDate(transferredAt)}. The inspection was carried out on ${melbourneDate(inspectedAt)}.`
}

/** The job's transfer code, created on first use. */
export async function transferLinkFor(supabase: SupabaseClient, jobId: string) {
  const { data: existing } = await supabase
    .from('report_transfer_links')
    .select('code,active')
    .eq('job_id', jobId)
    .maybeSingle()
  if (existing) {
    if (!existing.active) {
      await supabase.from('report_transfer_links').update({ active: true }).eq('job_id', jobId)
    }
    return existing.code as string
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = newTransferCode()
    const { error } = await supabase.from('report_transfer_links').insert({ code, job_id: jobId })
    if (!error) return code
  }
  throw new Error('Could not create the transfer link.')
}

/** What the public transfer page may show (no names, no report). */
export async function loadTransferOffer(supabase: SupabaseClient, code: string) {
  if (!isTransferCode(code)) return null
  const { data: link } = await supabase
    .from('report_transfer_links')
    .select('job_id,price_cents,active')
    .eq('code', code)
    .maybeSingle()
  if (!link?.active) return null
  const { data: job } = await supabase
    .from('jobs')
    .select('id,service_family,inspection_type,status,confirmed_start,property_snapshot')
    .eq('id', link.job_id)
    .maybeSingle()
  if (!job || job.status === 'cancelled') return null
  const { data: report } = await supabase
    .from('inspection_reports')
    .select('issued_at,report_kind')
    .eq('job_id', job.id)
    .eq('status', 'issued')
    .not('template_path', 'is', null)
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!report) return null
  const inspectedAt = (job.confirmed_start as string | null) || (report.issued_at as string)
  const closesAt = new Date(new Date(inspectedAt).getTime() + TRANSFER_DAYS * 86_400_000)
  const property = (job.property_snapshot || {}) as Record<string, string | null>
  return {
    address: [property.address, property.suburb, property.postcode].filter(Boolean).join(', '),
    inspectionType: job.inspection_type as string | null,
    serviceFamily: job.service_family as string,
    inspectedAt,
    closesAt: closesAt.toISOString(),
    open: Date.now() <= closesAt.getTime(),
    priceCents: link.price_cents as number,
  }
}

export function transferReadyEmail(input: {
  to: string
  firstName: string
  address: string
  reference: string
  url: string
  inspectedAt: string
}): EmailMessage {
  return {
    to: input.to,
    subject: `Your inspection report – ${input.address}`,
    text: `Hi ${input.firstName},

Thank you for your payment. The inspection report for ${input.address} (reference ${input.reference}) has been transferred to you.

View and download the report (PDF):
${input.url}

The inspection was carried out on ${melbourneDate(input.inspectedAt)}. The report describes the property on that day; if anything may have changed since, or you sign a contract more than 30 days after the inspection, consider a further inspection.

Start with the Summary page: it lists any major defects and safety hazards, the repairs grouped by trade and any further inspections we recommend.

If anything is unclear, reply to this email before you sign a contract or let a cooling-off, finance or building condition date pass.

Home Audit
${CONTACT_EMAIL}
${SITE_URL}`,
  }
}

/**
 * After payment: prints the new buyer's name into the report template,
 * registers it as their report, and emails them the download link. Safe to
 * call more than once.
 */
export async function completeTransfer(supabase: SupabaseClient, jobId: string) {
  const { data: job } = await supabase
    .from('jobs')
    .select('id,public_reference,payment_status,is_test,customer_snapshot,property_snapshot,transfer_of_report_id,quote_inputs')
    .eq('id', jobId)
    .maybeSingle()
  if (!job || job.payment_status !== 'paid' || !job.transfer_of_report_id) return 'skipped' as const

  const { count } = await supabase
    .from('inspection_reports')
    .select('id', { count: 'exact', head: true })
    .eq('job_id', jobId)
  if ((count || 0) > 0) return 'already' as const

  // The source job's current report (a newer version may have been issued
  // since the order was started).
  const { data: first } = await supabase
    .from('inspection_reports')
    .select('job_id')
    .eq('id', job.transfer_of_report_id)
    .maybeSingle()
  const { data: report } = await supabase
    .from('inspection_reports')
    .select('id,job_id,report_kind,template_path,name_slots,issued_at')
    .eq('job_id', first?.job_id || '')
    .eq('status', 'issued')
    .not('template_path', 'is', null)
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!report?.template_path) throw new Error('The report template is missing.')

  const customer = (job.customer_snapshot || {}) as Record<string, string | null>
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim() || customer.email || ''
  const inspectedAt = String((job.quote_inputs as Record<string, unknown> | null)?.inspected_at || report.issued_at)
  const now = new Date().toISOString()

  const { data: file, error: downloadError } = await supabase.storage.from(REPORT_BUCKET).download(report.template_path)
  if (downloadError || !file) throw new Error('The report template could not be read.')
  const stamped = await stampReport(new Uint8Array(await file.arrayBuffer()), nameSlots.parse(report.name_slots || []), {
    clientName: name,
    note: transferNote(name, now, inspectedAt),
  })
  const path = `${jobId}/${report.report_kind}-${Date.now()}-${randomUUID()}.pdf`
  const { error: uploadError } = await supabase.storage
    .from(REPORT_BUCKET)
    .upload(path, stamped, { contentType: 'application/pdf' })
  if (uploadError) throw new Error('The transferred report could not be saved.')

  const { data: inserted, error } = await supabase
    .from('inspection_reports')
    .insert({
      job_id: jobId,
      report_kind: report.report_kind,
      version_label: 'v1',
      storage_path: path,
      size_bytes: stamped.length,
      sha256: createHash('sha256').update(stamped).digest('hex'),
      status: 'issued',
      issued_at: now,
      client_name: name,
      sent_at: now,
      sent_to: customer.email || null,
    })
    .select('id')
    .single()
  if (error) {
    // Another call finished first.
    if (error.code === '23505') return 'already' as const
    throw new Error(error.message)
  }
  await supabase
    .from('jobs')
    .update({ report_status: 'issued', inspection_status: 'inspected', status: 'report_sent' })
    .eq('id', jobId)
  await supabase.from('audit_events').insert([
    { job_id: jobId, event_type: 'transfer_completed', actor_type: 'system', event_data: { report_id: inserted.id, from_report: report.id } },
    { job_id: report.job_id, event_type: 'report_transferred', actor_type: 'system', event_data: { to_job: job.public_reference } },
  ])

  const property = (job.property_snapshot || {}) as Record<string, string | null>
  const address = [property.address, property.suburb, property.postcode].filter(Boolean).join(', ')
  if (customer.email) {
    const token = await issueOrderToken(supabase, jobId)
    await sendEmail(
      transferReadyEmail({
        to: customer.email,
        firstName: customer.first_name || 'there',
        address,
        reference: job.public_reference,
        url: `${orderUrl(token)}#report`,
        inspectedAt,
      }),
      { supabase, jobId, templateKey: 'transfer_ready' },
    )
  }
  await sendEmail(
    markTest(
      {
        to: ownerEmail(),
        subject: `Report transfer paid – ${address}`,
        text: `A report transfer was paid and sent automatically.\n\nNew order: ${job.public_reference}\nBuyer: ${name} (${customer.email || 'no email'})\nProperty: ${address}\n\n${SITE_URL}/admin?q=${encodeURIComponent(job.public_reference)}#jobs`,
      },
      Boolean(job.is_test),
    ),
    { supabase, jobId, templateKey: 'owner_transfer_paid' },
  )
  return 'done' as const
}
