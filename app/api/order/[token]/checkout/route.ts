import { NextResponse } from 'next/server'
import { jobIdForToken } from '@/lib/access-tokens'
import { loadAgreementStatus } from '@/lib/agreement-store'
import { INSPECTION_TYPE_LABELS } from '@/lib/admin-format'
import {
  addressOf,
  centsOf,
  expireOpenSessions,
  instantPriceExpired,
  isPayable,
  loadOrder,
} from '@/lib/orders'
import { markTest, ownerEmail, sendEmail } from '@/lib/email'
import { ownerNewRequestEmail } from '@/lib/order-emails'
import { ORDER_RETURN_COOKIE, orderReturnCookieOptions, orderReturnCookieValue } from '@/lib/order-return'
import { isSameOriginMutation } from '@/lib/request-guard'
import { SITE_URL } from '@/lib/site'
import { getStripe, STRIPE_SITE_KEY } from '@/lib/stripe-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

// Starts a Stripe Checkout payment for a quoted order.
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  }
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Payment is unavailable.' }, { status: 503 })

  try {
    const { token } = await context.params
    const jobId = await jobIdForToken(supabase, token)
    const job = jobId ? await loadOrder(supabase, jobId) : null
    if (!job) return NextResponse.json({ error: 'This link has expired.' }, { status: 404 })
    // The instant price lapses once the date is less than 3 business days away.
    if (instantPriceExpired(job) && job.payment_status !== 'paid') {
      const reasons = [...(job.pricing_reasons || []), 'Date now within 3 business days']
      await supabase
        .from('jobs')
        .update({
          quote_status: 'manual_review',
          pricing_decision: 'manual',
          pricing_reasons: reasons,
          status: job.status === 'awaiting_payment' ? 'quote_received' : job.status,
        })
        .eq('id', job.id)
      await sendEmail(
        markTest(
          ownerNewRequestEmail({
            to: ownerEmail(),
            reference: job.public_reference,
            address: addressOf(job),
            decision: 'manual',
            reasons,
            adminUrl: `${SITE_URL}/admin?q=${encodeURIComponent(job.public_reference)}#jobs`,
          }),
          job.is_test,
        ),
        { supabase, jobId: job.id, templateKey: 'owner_review_needed' },
      )
      return NextResponse.json(
        { error: 'The date is now too close for the online price. We will check availability and email you.' },
        { status: 409 },
      )
    }
    if (!isPayable(job)) {
      return NextResponse.json({ error: 'This order cannot be paid online.' }, { status: 409 })
    }
    // The Inspection Agreement must be accepted before payment.
    const agreement = await loadAgreementStatus(supabase, job.id)
    if (!agreement.accepted || !agreement.version) {
      return NextResponse.json(
        { error: 'Please read and accept the Inspection Agreement before paying.' },
        { status: 409 },
      )
    }

    const stripe = getStripe()
    // Only one payment page may be open per job. If an open page turns out to
    // be paid already, never start a second payment.
    const previous = await expireOpenSessions(supabase, stripe, job.id)
    if (previous !== 'clear') {
      return NextResponse.json(
        {
          error:
            previous === 'paid'
              ? 'This order is already paid. Refresh the page.'
              : 'A payment for this order is still being processed. Please check again shortly.',
        },
        { status: 409 },
      )
    }
    const amount = centsOf(job.quote_total)

    // Record the payment first; the unique index allows one pending payment
    // per job, so a second click at the same moment is refused.
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        job_id: job.id,
        provider: 'stripe',
        status: 'pending',
        amount: amount / 100,
        amount_cents: amount,
        currency: 'aud',
      })
      .select('id')
      .single()
    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'A payment page is already being opened. Please wait a moment and try again.' },
        { status: 409 },
      )
    }
    const origin = new URL(request.url).origin
    // Read separately so payment still works before the translation migration.
    const { data: translationRow } = await supabase.from('jobs').select('*').eq('id', job.id).maybeSingle()
    const translationZh = Boolean((translationRow as { translation_zh?: boolean } | null)?.translation_zh)
    const service =
      job.intake_channel === 'report_transfer'
        ? 'Inspection report transfer'
        : job.service_family === 'new_home'
        ? 'New home inspection'
        : `${INSPECTION_TYPE_LABELS[job.inspection_type || ''] || 'Building'} inspection`
    const metadata = {
      site_key: STRIPE_SITE_KEY,
      job_id: job.id,
      payment_id: payment.id as string,
      reference: job.public_reference,
      agreement_version: agreement.version,
    }

    let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>
    try {
      session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'aud',
            unit_amount: amount,
            product_data: {
              name: `${service}${translationZh ? ' with Chinese translation' : ''} (Home Audit)`,
              description: addressOf(job).slice(0, 300) || job.public_reference,
            },
          },
        },
      ],
      customer_email: job.customer_snapshot?.email || undefined,
      client_reference_id: job.id,
      metadata,
      payment_intent_data: {
        metadata,
        description: `Home Audit ${job.public_reference}`,
        statement_descriptor_suffix: 'HOME AUDIT',
      },
      // The private order link is kept out of Stripe (the account is shared).
      success_url: `${origin}/order/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/order/cancelled`,
      }, { idempotencyKey: `home-audit-${payment.id}` })
    } catch (error) {
      await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id)
      throw error
    }

    // If this save fails, the webhook still finds the row by payment_id.
    await supabase.from('payments').update({ checkout_session_id: session.id }).eq('id', payment.id)
    if (!session.url) throw new Error('Stripe did not return a payment page.')

    const response = NextResponse.json({ url: session.url })
    response.cookies.set(ORDER_RETURN_COOKIE, orderReturnCookieValue(job.id), orderReturnCookieOptions)
    return response
  } catch (error) {
    console.error('checkout_failed', { message: error instanceof Error ? error.message : 'unknown' })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment could not be started.' },
      { status: 400 },
    )
  }
}
