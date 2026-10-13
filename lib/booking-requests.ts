// Server-only. Booking requests: up to three proposed times sent to the agent
// (or another access contact) with a private link. The reply updates the job.
import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { hashToken, isTokenShape } from '@/lib/access-tokens'
import { audit, jobAddress, loadJobContact } from '@/lib/admin-jobs'
import { saveBookedTime } from '@/lib/booking-notify'
import { validSlots } from '@/lib/booking-slots'
import { markTest, ownerEmail, sendEmail } from '@/lib/email'
import { bookingRequestEmail, bookingRequestSms, ownerBookingReplyEmail } from '@/lib/order-emails'
import { SITE_URL } from '@/lib/site'

export type BookingRequestRow = {
  id: string
  job_id: string
  slots: string[]
  channel: 'email' | 'sms' | 'link'
  service_label: string | null
  recipient_name: string | null
  recipient_email: string | null
  recipient_phone: string | null
  status: 'sent' | 'confirmed' | 'declined' | 'cancelled'
  chosen_start: string | null
  reply_message: string | null
  created_at: string
  responded_at: string | null
  expires_at: string
}

export const BOOKING_REQUEST_FIELDS =
  'id,job_id,slots,channel,service_label,recipient_name,recipient_email,recipient_phone,status,chosen_start,reply_message,created_at,responded_at,expires_at'

export function bookingRequestUrl(token: string) {
  return `${SITE_URL}/booking/${token}`
}

export function buyerNameOf(customer: Record<string, string | null> | null) {
  return [customer?.first_name, customer?.last_name].filter(Boolean).join(' ').trim()
}

export async function createBookingRequest(
  supabase: SupabaseClient,
  jobId: string,
  input: {
    slots: string[]
    channel: 'email' | 'sms' | 'link'
    recipientName: string
    recipientEmail: string
    recipientPhone: string
    service: string
  },
) {
  const job = await loadJobContact(supabase, jobId)
  if (job.payment_status !== 'paid') throw new Error('Arrange a time once the job is paid.')
  const slots = validSlots(input.slots)
  if (!slots) throw new Error('Choose one to three times in the future.')
  if (input.channel === 'email' && !input.recipientEmail) throw new Error('Enter the email address first.')
  if (input.channel === 'sms' && !input.recipientPhone) throw new Error('Enter the mobile number first.')

  const token = randomBytes(32).toString('base64url')
  const { data, error } = await supabase
    .from('booking_requests')
    .insert({
      job_id: jobId,
      token_hash: hashToken(token),
      slots,
      channel: input.channel,
      service_label: input.service,
      recipient_name: input.recipientName || null,
      recipient_email: input.recipientEmail || null,
      recipient_phone: input.recipientPhone || null,
    })
    .select('id')
    .single()
  if (error || !data) {
    throw new Error(
      error && /booking_requests/.test(error.message)
        ? 'Run the booking requests SQL in Supabase first (see BACKEND_SETUP.md).'
        : 'Could not create the request.',
    )
  }

  const url = bookingRequestUrl(token)
  const address = jobAddress(job)
  const details = {
    recipientName: input.recipientName,
    buyerName: buyerNameOf(job.customer_snapshot),
    address,
    service: input.service,
    slots,
    url,
  }

  if (input.channel === 'email') {
    const sent = await sendEmail(
      markTest(bookingRequestEmail({ to: input.recipientEmail, ...details }), job.is_test),
      { supabase, jobId, templateKey: 'booking_request' },
    )
    if (!sent.sent) {
      await supabase.from('booking_requests').update({ status: 'cancelled' }).eq('id', data.id)
      throw new Error(sent.reason)
    }
  }

  await supabase
    .from('jobs')
    .update({ status: job.status === 'paid' ? 'scheduling' : job.status })
    .eq('id', jobId)
  await audit(supabase, jobId, 'booking_request_sent', { channel: input.channel, slots })

  return {
    url,
    smsText: input.channel === 'sms' ? bookingRequestSms(details) : '',
  }
}

export async function loadBookingRequest(supabase: SupabaseClient, token: string) {
  if (!isTokenShape(token)) return null
  const { data } = await supabase
    .from('booking_requests')
    .select(BOOKING_REQUEST_FIELDS)
    .eq('token_hash', hashToken(token))
    .maybeSingle()
  return (data as BookingRequestRow | null) || null
}

export function requestIsOpen(request: BookingRequestRow, now = Date.now()) {
  return request.status === 'sent' && new Date(request.expires_at).getTime() > now
}

// The reply from the agent's page. Only one reply counts: the update only
// matches while the request is still open.
export async function answerBookingRequest(
  supabase: SupabaseClient,
  token: string,
  answer: { action: 'confirm'; slot: string } | { action: 'decline'; message: string },
) {
  const request = await loadBookingRequest(supabase, token)
  if (!request || !requestIsOpen(request)) return { ok: false as const, reason: 'closed' as const }

  let chosen: string | null = null
  if (answer.action === 'confirm') {
    chosen = request.slots.map((slot) => new Date(slot).toISOString()).find(
      (slot) => slot === new Date(answer.slot).toISOString(),
    ) || null
    if (!chosen) return { ok: false as const, reason: 'invalid' as const }
  }

  const { data: claimed, error } = await supabase
    .from('booking_requests')
    .update({
      status: answer.action === 'confirm' ? 'confirmed' : 'declined',
      chosen_start: chosen,
      reply_message: answer.action === 'decline' ? answer.message || null : null,
      responded_at: new Date().toISOString(),
    })
    .eq('id', request.id)
    .eq('status', 'sent')
    .gt('expires_at', new Date().toISOString())
    .select('id')
  if (error) throw new Error(error.message)
  if (!claimed?.length) return { ok: false as const, reason: 'closed' as const }

  const job = await loadJobContact(supabase, request.job_id)
  let customerEmailed: 'sent' | 'not_sent' | 'unchanged' = 'unchanged'
  if (chosen) {
    const result = await saveBookedTime(supabase, request.job_id, chosen, { keepRequestId: request.id })
    customerEmailed = result.bookingEmail
  }

  await supabase.from('audit_events').insert({
    job_id: request.job_id,
    event_type: chosen ? 'booking_request_confirmed' : 'booking_request_declined',
    actor_type: 'agent',
    event_data: { request_id: request.id, chosen_start: chosen },
  })

  await sendEmail(
    markTest(
      ownerBookingReplyEmail({
        to: ownerEmail(),
        reference: job.public_reference,
        address: jobAddress(job),
        recipientName: request.recipient_name || '',
        outcome: chosen ? 'confirmed' : 'declined',
        chosenIso: chosen || undefined,
        message: answer.action === 'decline' ? answer.message : undefined,
        customerEmailed,
        adminUrl: `${SITE_URL}/admin?q=${encodeURIComponent(job.public_reference)}#jobs`,
      }),
      job.is_test,
    ),
    { supabase, jobId: request.job_id, templateKey: 'owner_booking_reply' },
  )

  return { ok: true as const, chosen }
}
