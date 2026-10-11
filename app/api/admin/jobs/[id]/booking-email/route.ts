import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { sendBookingDateEmail } from '@/lib/booking-notify'

export const runtime = 'nodejs'

// Sends the confirmed date again. The time is not included.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    await sendBookingDateEmail(supabase, id)
    return adminJson({ ok: true })
  } catch (error) {
    return adminError(error, 'Unable to email the customer.')
  }
}
