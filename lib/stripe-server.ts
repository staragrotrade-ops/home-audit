// Server-only. Stripe client with a guard so production only runs on live keys
// and previews only on test keys.
import Stripe from 'stripe'

export const STRIPE_SITE_KEY = 'home_audit'

export function stripeKeyMode(key?: string | null) {
  const value = key?.trim() || ''
  if (/^(sk|rk)_live_/.test(value)) return 'live'
  if (/^(sk|rk)_test_/.test(value)) return 'test'
  return 'unknown'
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Online payment is not set up yet.')
  const mode = stripeKeyMode(key)
  const environment = process.env.VERCEL_ENV
  if (environment === 'production' && mode !== 'live') {
    throw new Error('Online payment is not set up yet.')
  }
  if (environment === 'preview' && mode !== 'test') {
    throw new Error('Preview sites must use a Stripe test key.')
  }
  return new Stripe(key)
}
