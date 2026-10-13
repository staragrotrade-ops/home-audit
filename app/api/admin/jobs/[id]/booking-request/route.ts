import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { audit } from '@/lib/admin-jobs'
import { createBookingRequest } from '@/lib/booking-requests'
import { readJsonBody } from '@/lib/request-guard'

export const runtime = 'nodejs'

const phone = z.string().trim().max(40).regex(/^[0-9+() -]*$/, 'Use digits, spaces and + in the mobile number.')

const createSchema = z
  .object({
    slots: z.array(z.iso.datetime({ offset: true })).min(1).max(3),
    channel: z.enum(['email', 'sms', 'link']),
    recipientName: z.string().trim().max(120).default(''),
    recipientEmail: z.union([z.literal(''), z.email('Check the email address.').max(180)]).default(''),
    recipientPhone: phone.default(''),
    service: z.string().trim().min(3).max(120),
  })
  .strict()

// Creates a booking request and, for email, sends it. For a text message the
// link and text are returned so the owner's phone can send it.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const parsed = createSchema.safeParse(await readJsonBody(request, 5_000))
    if (!parsed.success) {
      return adminJson({ ok: false, error: parsed.error.issues[0]?.message || 'Check the details.' }, 400)
    }
    const result = await createBookingRequest(supabase, id, parsed.data)
    return adminJson({ ok: true, ...result })
  } catch (error) {
    return adminError(error, 'Unable to create the booking request.')
  }
}

// Cancels a request that has not been answered, so its link stops working.
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const { requestId } = z.object({ requestId: z.uuid() }).strict().parse(await readJsonBody(request, 1_000))
    const { error } = await supabase
      .from('booking_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('job_id', id)
      .eq('status', 'sent')
    if (error) throw new Error(error.message)
    await audit(supabase, id, 'booking_request_cancelled', { request_id: requestId })
    return adminJson({ ok: true })
  } catch (error) {
    return adminError(error, 'Unable to cancel the request.')
  }
}
