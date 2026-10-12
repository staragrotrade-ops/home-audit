import type Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { settleCheckoutSession } from '@/lib/orders'
import { getStripe } from '@/lib/stripe-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const CHECKOUT_EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
])

// Stripe sends every event of the shared account here. Sessions that are not
// Home Audit's (no site_key "home_audit") are acknowledged and ignored.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const supabase = getSupabaseAdmin()
  if (!secret || !supabase) return new NextResponse('Webhook not configured', { status: 503 })

  const signature = request.headers.get('stripe-signature')
  if (!signature) return new NextResponse('Missing signature', { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret)
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : 'Invalid webhook', { status: 400 })
  }

  try {
    if (CHECKOUT_EVENTS.has(event.type)) {
      await settleCheckoutSession(supabase, event.data.object as Stripe.Checkout.Session)
    }
    await supabase
      .from('stripe_events')
      .upsert({ event_id: event.id, event_type: event.type }, { onConflict: 'event_id', ignoreDuplicates: true })
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('stripe_webhook_failed', { message: error instanceof Error ? error.message : 'unknown' })
    // A 500 makes Stripe retry; marking paid is safe to repeat.
    return new NextResponse('Webhook processing failed', { status: 500 })
  }
}
