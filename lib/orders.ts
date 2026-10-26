// Server-only. Loading a customer's order and recording Stripe payments.
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import { issueOrderToken, orderUrl } from '@/lib/access-tokens'
import { ownerEmail, sendEmail, markTest } from '@/lib/email'
import { ownerPaidEmail, ownerPaymentProblemEmail, paymentReceivedEmail } from '@/lib/order-emails'
import { earliestInstantDate } from '@/lib/pricing'
import { SITE_URL } from '@/lib/site'
import { syncJobToXero } from '@/lib/xero'
import { STRIPE_SITE_KEY } from '@/lib/stripe-server'
import { redeemJobVoucher } from '@/lib/vouchers'
import { completeTransfer } from '@/lib/report-transfer'

export const ORDER_COLUMNS =
  'id,public_reference,service_family,inspection_type,new_home_stages,status,quote_status,payment_status,quote_subtotal,gst,quote_total,pricing_decision,pricing_reasons,is_test,archived_at,customer_snapshot,property_snapshot,preferred_date_1,deadline,buyer_situation,access_choice,access_other_name,access_other_phone,agent_name,agent_phone,details_submitted_at,confirmed_start,booking_notified_at,paid_notified_at,intake_channel'

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
  pricing_reasons: string[] | null
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
  paid_notified_at: string | null
  intake_channel: string
}

export async function loadOrder(supabase: SupabaseClient, jobId: string) {
  const { data } = await supabase.from('jobs').select(ORDER_COLUMNS).eq('id', jobId).maybeSingle()
  return (data as OrderJob | null) || null
}

export function centsOf(value: number | string | null | undefined) {
  return Math.round(Number(value || 0) * 100)
}

// An instant price is only valid while the requested date is still at least
// three business days away. Reviewed (manual) prices are not re-checked.
export function instantPriceExpired(job: OrderJob, today?: string) {
  if (job.pricing_decision !== 'instant') return false
  const earliest = earliestInstantDate(today)
  return Boolean(
    (job.preferred_date_1 && job.preferred_date_1 < earliest) || (job.deadline && job.deadline < earliest),
  )
}

export function isPayable(job: OrderJob) {
  return (
    job.quote_status === 'quoted' &&
    job.payment_status !== 'paid' &&
    !job.archived_at &&
    job.status !== 'cancelled' &&
    centsOf(job.quote_total) > 0 &&
    !instantPriceExpired(job)
  )
}

export function addressOf(job: OrderJob) {
  const property = job.property_snapshot || {}
  return [property.address, property.suburb, property.postcode].filter(Boolean).join(', ')
}

// Closes every payment page still open for a job, so an old page cannot be
// paid after a new one is opened or the price changes. Returns 'paid' or
// 'processing' when an open page has in fact already been paid (the webhook
// has not arrived yet): no new payment may be started then.
export async function expireOpenSessions(
  supabase: SupabaseClient,
  stripe: Stripe,
  jobId: string,
): Promise<'clear' | 'paid' | 'processing'> {
  const { data } = await supabase
    .from('payments')
    .select('id,checkout_session_id,created_at')
    .eq('job_id', jobId)
    .eq('status', 'pending')
  let result: 'clear' | 'paid' | 'processing' = 'clear'
  for (const payment of data || []) {
    const sessionId = payment.checkout_session_id as string | null
    // A row without a session that is less than two minutes old is another
    // request still opening its page: leave it, and the new insert is refused.
    if (!sessionId && Date.now() - new Date(payment.created_at as string).getTime() < 120_000) continue
    if (sessionId) {
      try {
        await stripe.checkout.sessions.expire(sessionId)
      } catch {
        // Expiring fails when the page was completed: find out how.
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        if (session.payment_status === 'paid') {
          await settleCheckoutSession(supabase, session)
          result = 'paid'
          continue
        }
        if (session.status === 'complete') {
          // Paid by a method that clears later; the webhook will finish it.
          result = result === 'paid' ? 'paid' : 'processing'
          continue
        }
      }
    }
    await supabase.from('payments').update({ status: 'expired' }).eq('id', payment.id).eq('status', 'pending')
  }
  return result
}

// Sends the "paid" emails once per job. The claim happens after the link is
// created, so a failure before it lets a Stripe retry try again.
async function notifyPaid(supabase: SupabaseClient, jobId: string, amountCents: number) {
  const job = await loadOrder(supabase, jobId)
  if (!job || job.payment_status !== 'paid' || job.paid_notified_at) return
  const customer = job.customer_snapshot || {}
  const link = customer.email ? orderUrl(await issueOrderToken(supabase, jobId)) : ''

  const { data: claimed } = await supabase
    .from('jobs')
    .update({ paid_notified_at: new Date().toISOString() })
    .eq('id', jobId)
    .is('paid_notified_at', null)
    .select('id')
    .maybeSingle()
  if (!claimed) return

  const address = addressOf(job)
  // A report transfer: issue the report in the buyer's name and email it;
  // there is nothing to book.
  if (job.intake_channel === 'report_transfer') {
    try {
      await completeTransfer(supabase, jobId)
    } catch (error) {
      await sendEmail(
        {
          to: ownerEmail(),
          subject: `Report transfer needs attention – ${job.public_reference}`,
          text: `The transfer for ${address} was paid but the report could not be issued automatically: ${error instanceof Error ? error.message : 'unknown error'}.\n\n${SITE_URL}/admin?q=${encodeURIComponent(job.public_reference)}#jobs`,
        },
        { supabase, jobId, templateKey: 'owner_transfer_failed' },
      )
    }
    if (!job.is_test) await syncJobToXero(supabase, jobId)
    return
  }
  if (customer.email) {
    await sendEmail(
      paymentReceivedEmail({
        to: customer.email,
        firstName: customer.first_name || 'there',
        address,
        reference: job.public_reference,
        totalCents: amountCents,
        url: link,
      }),
      { supabase, jobId, templateKey: 'payment_received' },
    )
  }
  await sendEmail(
    markTest(
      ownerPaidEmail({
        to: ownerEmail(),
        reference: job.public_reference,
        address,
        totalCents: amountCents,
        adminUrl: `${SITE_URL}/admin?q=${encodeURIComponent(job.public_reference)}#jobs`,
      }),
      job.is_test,
    ),
    { supabase, jobId, templateKey: 'owner_paid' },
  )

  // Paid invoice in Xero (emailed to the customer by Xero). Test orders are
  // kept out of the accounts. Failures are recorded and can be retried from
  // the dashboard.
  if (!job.is_test) await syncJobToXero(supabase, jobId)
}

// Applies a Checkout session from Stripe. Only a Home Audit session whose
// payment status is "paid" counts; the database checks the job and amount.
export async function settleCheckoutSession(supabase: SupabaseClient, session: Stripe.Checkout.Session) {
  if (session.metadata?.site_key !== STRIPE_SITE_KEY) return 'ignored' as const
  const jobId = session.metadata.job_id || session.client_reference_id
  if (!jobId) throw new Error('Checkout session has no job.')
  if (session.payment_status !== 'paid') return 'pending' as const
  if (session.amount_total == null) throw new Error('Checkout session has no amount.')

  const { data: outcome, error } = await supabase.rpc('mark_job_paid', {
    p_job_id: jobId,
    p_session_id: session.id,
    p_amount_cents: session.amount_total,
    p_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    p_payment_id: /^[0-9a-f-]{36}$/.test(session.metadata?.payment_id || '') ? session.metadata!.payment_id : null,
  })
  if (error) throw new Error(error.message)

  if (outcome === 'duplicate' || outcome === 'mismatch') {
    const job = await loadOrder(supabase, jobId)
    await sendEmail(
      ownerPaymentProblemEmail({
        to: ownerEmail(),
        reference: job?.public_reference || jobId,
        problem: outcome,
        amountCents: session.amount_total,
        sessionId: session.id,
      }),
      { supabase, jobId, templateKey: `owner_payment_${outcome}` },
    )
  }

  await redeemJobVoucher(supabase, jobId)
  await notifyPaid(supabase, jobId, session.amount_total)
  return 'paid' as const
}
