import { z } from 'zod'
import { issueOrderToken, orderUrl } from '@/lib/access-tokens'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { audit, jobAddress, loadJobContact } from '@/lib/admin-jobs'
import { sendEmail } from '@/lib/email'
import { quoteReadyEmail } from '@/lib/order-emails'
import { gstFor } from '@/lib/pricing'
import { readJsonBody } from '@/lib/request-guard'

export const runtime = 'nodejs'

const schema = z.object({
  priceExGst: z.number().min(50).max(20_000),
  sendEmail: z.boolean().default(true),
})

// Sets a manually reviewed price and sends the customer a link to pay.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const input = schema.parse(await readJsonBody(request, 2_000))
    const job = await loadJobContact(supabase, id)
    if (job.payment_status === 'paid') throw new Error('This job is already paid.')

    const subtotalCents = Math.round(input.priceExGst * 100)
    const gstCents = gstFor(subtotalCents)
    const totalCents = subtotalCents + gstCents

    const { error } = await supabase
      .from('jobs')
      .update({
        quote_subtotal: subtotalCents / 100,
        gst: gstCents / 100,
        quote_total: totalCents / 100,
        quote_status: 'quoted',
        status: 'awaiting_payment',
        pricing_rule_version: 'manual',
      })
      .eq('id', id)
    if (error) throw new Error(error.message)

    const url = orderUrl(await issueOrderToken(supabase, id))
    let emailed = false
    const customer = job.customer_snapshot || {}
    if (input.sendEmail && customer.email) {
      const result = await sendEmail(
        quoteReadyEmail({
          to: customer.email,
          firstName: customer.first_name || 'there',
          address: jobAddress(job),
          totalCents,
          url,
        }),
        { supabase, jobId: id, templateKey: 'quote_ready' },
      )
      emailed = result.sent
    }
    await audit(supabase, id, 'manual_quote_sent', { total_cents: totalCents, emailed })
    return adminJson({ ok: true, url, emailed, totalCents })
  } catch (error) {
    return adminError(error, 'Unable to send the quote.')
  }
}
