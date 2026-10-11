// Server-only. Decides whether an analytics request should be stored.
import { isExcludedRequest } from '@/lib/analytics-exclusion'
import { isAllowedBeaconOrigin, isLikelyBot } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const ANALYTICS_MAX_BODY_BYTES = 4_000

export function analyticsStore(request: Request) {
  // Preview deployments share the database, so only production visits count.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') return null
  if (!isAllowedBeaconOrigin(request) || isLikelyBot(request) || isExcludedRequest(request)) {
    return null
  }
  return getSupabaseAdmin()
}

export function noContent() {
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
