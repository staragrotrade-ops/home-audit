import { NextResponse } from 'next/server'
import { jobIdForToken } from '@/lib/access-tokens'
import { INSPECTION_TYPE_LABELS } from '@/lib/admin-format'
import { addressOf, centsOf, isPayable, loadOrder } from '@/lib/orders'
import { isSameOriginMutation } from '@/lib/request-guard'
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
    if (!isPayable(job)) {
      return NextResponse.json({ error: 'This order cannot be paid online.' }, { status: 409 })
    }

    const stripe = getStripe()
    const amount = centsOf(job.quote_total)
    const origin = new URL(request.url).origin
    const service =
      job.service_family === 'new_home'
        ? 'New home inspection'
        : `${INSPECTION_TYPE_LABELS[job.inspection_type || ''] || 'Building'} inspection`
    const metadata = { site_key: STRIPE_SITE_KEY, job_id: job.id, reference: job.public_reference }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'aud',
            unit_amount: amount,
            product_data: {
              name: `${service} (Home Audit)`,
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
      success_url: `${origin}/order/${token}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/order/${token}`,
    })

    const { error } = await supabase.from('payments').insert({
      job_id: job.id,
      provider: 'stripe',
      status: 'pending',
      amount: amount / 100,
      amount_cents: amount,
      currency: 'aud',
      checkout_session_id: session.id,
    })
    if (error) throw new Error(error.message)
    if (!session.url) throw new Error('Stripe did not return a payment page.')

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('checkout_failed', { message: error instanceof Error ? error.message : 'unknown' })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment could not be started.' },
      { status: 400 },
    )
  }
}
