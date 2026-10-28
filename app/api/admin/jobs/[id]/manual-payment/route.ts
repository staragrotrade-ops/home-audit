import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { readJsonBody } from '@/lib/request-guard'

export const runtime = 'nodejs'

const schema = z.discriminatedUnion('paid', [
  z.object({
    paid: z.literal(true),
    method: z.enum(['bank_transfer', 'cash', 'card', 'other']),
    amount: z.number().positive().max(100000),
    reference: z.string().trim().max(120).default(''),
    paidOn: z.union([z.literal(''), z.iso.date()]).default(''),
  }),
  z.object({ paid: z.literal(false) }),
])

// Records (or removes) a payment received outside the website. No email or
// Xero invoice is sent: the owner invoices these jobs by hand.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase
  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const input = schema.parse(await readJsonBody(request, 2_000))
    const { error } = await supabase.rpc(
      'set_manual_payment',
      input.paid
        ? {
            p_job_id: id,
            p_paid: true,
            p_method: input.method,
            p_amount: input.amount,
            p_reference: input.reference,
            // Midday in Melbourne, so the date never slips a day.
            p_paid_at: input.paidOn ? `${input.paidOn}T12:00:00+11:00` : null,
          }
        : { p_job_id: id, p_paid: false },
    )
    if (error) throw new Error(error.message)
    return adminJson({ ok: true })
  } catch (error) {
    return adminError(error, 'Unable to update the payment.')
  }
}
