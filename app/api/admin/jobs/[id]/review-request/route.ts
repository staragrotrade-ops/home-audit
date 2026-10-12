import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { audit, loadJobContact } from '@/lib/admin-jobs'
import { sendEmail } from '@/lib/email'
import { reviewRequestEmail } from '@/lib/order-emails'
import { readJsonBody } from '@/lib/request-guard'

export const runtime = 'nodejs'

const schema = z.object({ channel: z.enum(['email', 'sms']) })

// Sends (email) or records (text, sent from the owner's phone) a Google review request.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const { channel } = schema.parse(await readJsonBody(request, 500))
    const job = await loadJobContact(supabase, id)

    if (channel === 'email') {
      const reviewUrl = process.env.GOOGLE_REVIEW_URL
      if (!reviewUrl) throw new Error('GOOGLE_REVIEW_URL is not set.')
      const customer = job.customer_snapshot || {}
      if (!customer.email) throw new Error('The customer has no email address.')
      const result = await sendEmail(
        reviewRequestEmail({ to: customer.email, firstName: customer.first_name || 'there', reviewUrl }),
        { supabase, jobId: id, templateKey: 'review_request' },
      )
      if (!result.sent) throw new Error(result.reason)
    }

    const { error } = await supabase
      .from('jobs')
      .update({ review_requested_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(error.message)
    await audit(supabase, id, 'review_requested', { channel })
    return adminJson({ ok: true })
  } catch (error) {
    return adminError(error, 'Unable to send the review request.')
  }
}
