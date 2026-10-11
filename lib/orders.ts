// Server-only. Loading a customer's order and recording Stripe payments.
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { issueOrderToken, orderUrl } from '@/lib/access-tokens'
import { ownerEmail, sendEmail } from '@/lib/email'
import { ownerPaidEmail, paymentReceivedEmail } from '@/lib/order-emails'
import { SITE_URL } from '@/lib/site'
import { STRIPE_SITE_KEY } from '@/lib/stripe-server'

export const ORDER_COLUMNS =
  'id,public_reference,service_family,inspection_type,new_home_stages,status,quote_status,payment_status,quote_subtotal,gst,quote_total,pricing_decision,is_test,archived_at,customer_snapshot,property_snapshot,preferred_date_1,deadline,buyer_situation,access_choice,access_other_name,access_other_phone,agent_name,agent_phone,details_submitted_at,confirmed_start,booking_notified_at'

export type OrderJob = {
  id: string
  public_reference: string
  service_family: 'existing_home' | 'new_home'
  inspection_type: string | null
  new_home_stages: string[]
  status: string
  quote_status: string
  payment_status: string
  quote_subtotal: number | null
  gst: number | null
  quote_total: number | null
  pricing_decision: string | null
  is_test: boolean
  archived_at: string | null
  customer_snapshot: Record<string, string | null>
  property_snapshot: Record<string, string | null>
  preferred_date_1: string | null
  deadline: string | null
  buyer_situation: string | null
  access_choice: string | null
  access_other_name: string | null
  access_other_phone: string | null
  agent_name: string | null
  agent_phone: string | null
  details_submitted_at: string | null
  confirmed_start: string | null
  booking_notified_at: string | null
}

export async function loadOrder(supabase: SupabaseClient, jobId: string) {
  const { data } = await supabase.from('jobs').select(ORDER_COLUMNS).eq('id', jobId).maybeSingle()
  return (data as OrderJob | null) || null
}

export function centsOf(value: number | string | null | undefined) {
  return Math.round(Number(value || 0) * 100)
}

export function isPayable(job: OrderJob) {
  return (
    job.quote_status === 'quoted' &&
    job.payment_status !== 'paid' &&
    !job.archived_at &&
    job.status !== 'cancelled' &&
    centsOf(job.quote_total) > 0
  )
}

export function addressOf(job: OrderJob) {
  const property = job.property_snapshot || {}
  return [property.address, property.suburb, property.postcode].filter(Boolean).join(', ')
}

// Applies a Checkout session from Stripe. Only a session whose payment status
// is "paid" marks the job paid; the database checks the amount and the job.
export async function settleCheckoutSession(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
  if (session.metadata?.site_key !== STRIPE_SITE_KEY) return 'ignored' as const
  const jobId = session.metadata.job_id || session.client_reference_id
  if (!jobId) throw new Error('Checkout session has no job.')
  if (session.payment_status !== 'paid') return 'pending' as const
  if (session.amount_total == null) throw new Error('Checkout session has no amount.')

  const { data: newlyPaid, error } = await supabase.rpc('mark_job_paid', {
    p_job_id: jobId,
    p_session_id: session.id,
    p_amount_cents: session.amount_total,
    p_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
  })
  if (error) throw new Error(error.message)

  if (newlyPaid === true) {
    const job = await loadOrder(supabase, jobId)
    if (job) {
      const customer = job.customer_snapshot || {}
      const address = addressOf(job)
      if (customer.email) {
        const link = orderUrl(await issueOrderToken(supabase, jobId))
        await sendEmail(
          paymentReceivedEmail({
            to: customer.email,
            firstName: customer.first_name || 'there',
            address,
            reference: job.public_reference,
            totalCents: session.amount_total,
            url: link,
          }),
          { supabase, jobId, templateKey: 'payment_received' },
        )
      }
      if (!job.is_test) {
        await sendEmail(
          ownerPaidEmail({
            to: ownerEmail(),
            reference: job.public_reference,
            address,
            totalCents: session.amount_total,
            adminUrl: `${SITE_URL}/admin?q=${encodeURIComponent(job.public_reference)}#jobs`,
          }),
          { supabase, jobId, templateKey: 'owner_paid' },
        )
      }
    }
  }
  return 'paid' as const
}
