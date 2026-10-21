// Server-only. Saves the booked inspection time and emails the customer the
// confirmed DATE (never the time).
import type { SupabaseClient } from '@supabase/supabase-js'
import { audit, jobAddress, loadJobContact } from '@/lib/admin-jobs'
import { markTest, sendEmail } from '@/lib/email'
import { syncJobCalendar } from '@/lib/google-calendar'
import { bookingConfirmedEmail } from '@/lib/order-emails'

export async function sendBookingDateEmail(supabase: SupabaseClient, id: string) {
  const job = await loadJobContact(supabase, id)
  if (!job.confirmed_start) throw new Error('Save the booked date and time first.')
  const customer = job.customer_snapshot || {}
  if (!customer.email) throw new Error('The customer has no email address.')

  const result = await sendEmail(
    markTest(
      bookingConfirmedEmail({
        to: customer.email,
        firstName: customer.first_name || 'there',
        address: jobAddress(job),
        dateIso: job.confirmed_start,
      }),
      job.is_test,
    ),
    { supabase, jobId: id, templateKey: 'booking_confirmed' },
  )
  if (!result.sent) throw new Error(result.reason)

  const { error } = await supabase
    .from('jobs')
    .update({
      booking_notified_at: new Date().toISOString(),
      status: BOOKABLE_STATUSES.includes(job.status) ? 'confirmed' : job.status,
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  await audit(supabase, id, 'booking_email_sent', { date: job.confirmed_start })
}

/** Open statuses that become Booked once a time is saved. */
export const BOOKABLE_STATUSES = ['quote_received', 'awaiting_customer', 'awaiting_payment', 'paid', 'scheduling']

export function melbourneDay(iso: string | null | undefined) {
  return iso
    ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' }).format(new Date(iso))
    : ''
}

export type BookingEmailResult = { bookingEmail: 'sent' | 'not_sent' | 'unchanged'; bookingEmailError: string }

// Sets (or clears) the booked time. Any booking request still waiting for a
// reply is closed, so a late click on an old link cannot move the booking.
// A new or changed DAY is emailed to a paid customer straight away; a change
// of time on the same day is not re-sent.
export async function saveBookedTime(
  supabase: SupabaseClient,
  id: string,
  startIso: string | null,
  options: { keepRequestId?: string } = {},
): Promise<BookingEmailResult> {
  const before = await loadJobContact(supabase, id)

  // The status follows the booked time: a time moves an open job to Booked
  // (whatever the payment state, which is shown separately); clearing the time
  // moves a Booked job back to Scheduling.
  const update: Record<string, unknown> = { confirmed_start: startIso, confirmed_end: null }
  if (startIso && BOOKABLE_STATUSES.includes(before.status)) update.status = 'confirmed'
  if (!startIso && before.status === 'confirmed') update.status = 'scheduling'
  const { error } = await supabase.from('jobs').update(update).eq('id', id)
  if (error) throw new Error(error.message)

  let close = supabase
    .from('booking_requests')
    .update({ status: 'cancelled' })
    .eq('job_id', id)
    .eq('status', 'sent')
  if (options.keepRequestId) close = close.neq('id', options.keepRequestId)
  const { error: closeError } = await close
  // Before the booking_requests migration is applied there is nothing to close.
  if (closeError && !/booking_requests/.test(closeError.message)) throw new Error(closeError.message)

  // Put the job in (or take it out of) Google Calendar. A calendar problem is
  // recorded on the job and never stops the booking.
  await syncJobCalendar(supabase, id)

  if (!startIso || before.payment_status !== 'paid') return { bookingEmail: 'unchanged', bookingEmailError: '' }
  if (melbourneDay(startIso) === melbourneDay(before.confirmed_start)) {
    return { bookingEmail: 'unchanged', bookingEmailError: '' }
  }
  try {
    await sendBookingDateEmail(supabase, id)
    return { bookingEmail: 'sent', bookingEmailError: '' }
  } catch (sendError) {
    return {
      bookingEmail: 'not_sent',
      bookingEmailError: sendError instanceof Error ? sendError.message : 'Email failed.',
    }
  }
}
