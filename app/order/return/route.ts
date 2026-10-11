import { NextResponse } from 'next/server'
import { issueOrderToken } from '@/lib/access-tokens'
import { settleCheckoutSession } from '@/lib/orders'
import { getStripe, STRIPE_SITE_KEY } from '@/lib/stripe-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_SESSION_AGE_SECONDS = 2 * 24 * 60 * 60

// Stripe sends the customer here after paying. The payment is confirmed
// straight away (without waiting for the webhook) and the customer is sent on
// to their order page with a fresh private link.
export async function GET(request: Request) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get('session_id') || ''
  const supabase = getSupabaseAdmin()
  const expired = new URL('/order/cancelled?expired=1', url.origin)
  if (!supabase || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)) {
    return NextResponse.redirect(expired, 303)
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId)
    const jobId = session.metadata?.job_id
    const recent = Date.now() / 1000 - session.created < MAX_SESSION_AGE_SECONDS
    if (session.metadata?.site_key !== STRIPE_SITE_KEY || !jobId || !recent) {
      return NextResponse.redirect(expired, 303)
    }
    const outcome = await settleCheckoutSession(supabase, session)
    const token = await issueOrderToken(supabase, jobId)
    const next = new URL(`/order/${token}`, url.origin)
    if (outcome === 'pending') next.searchParams.set('pending', '1')
    return NextResponse.redirect(next, 303)
  } catch (error) {
    console.error('order_return_failed', { message: error instanceof Error ? error.message : 'unknown' })
    return NextResponse.redirect(expired, 303)
  }
}
