import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { audit, jobAddress, loadJobContact } from '@/lib/admin-jobs'
import { sendEmail } from '@/lib/email'
import { bookingConfirmedEmail } from '@/lib/order-emails'

export const runtime = 'nodejs'

// Emails the customer the confirmed inspection date. The time is not included.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const job = await loadJobContact(supabase, id)
    if (!job.confirmed_start) throw new Error('Save the booked date and time first.')
    const customer = job.customer_snapshot || {}
    if (!customer.email) throw new Error('The customer has no email address.')

    const result = await sendEmail(
      bookingConfirmedEmail({
        to: customer.email,
        firstName: customer.first_name || 'there',
        address: jobAddress(job),
        dateIso: job.confirmed_start,
      }),
      { supabase, jobId: id, templateKey: 'booking_confirmed' },
    )
    if (!result.sent) throw new Error(result.reason)

    const { error } = await supabase
      .from('jobs')
      .update({
        booking_notified_at: new Date().toISOString(),
        status: ['paid', 'scheduling', 'awaiting_customer'].includes(job.status) ? 'confirmed' : job.status,
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
    await audit(supabase, id, 'booking_email_sent', { date: job.confirmed_start })
    return adminJson({ ok: true })
  } catch (error) {
    return adminError(error, 'Unable to email the customer.')
  }
}
