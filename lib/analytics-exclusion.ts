// Server-only. Marks the owner's own browsers so their visits are not counted.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { readCookie } from '@/lib/admin-session'

export const ANALYTICS_EXCLUSION_COOKIE = 'ha_analytics_excluded'
const VERSION = 'v1'

function signature() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || secret.length < 24) return null
  return createHmac('sha256', secret).update(`analytics-exclusion:${VERSION}`).digest('base64url')
}

export function createExclusionToken() {
  const value = signature()
  if (!value) throw new Error('ADMIN_SESSION_SECRET is not configured.')
  return `${VERSION}.${value}`
}

export function isExcludedRequest(request: Request) {
  const token = readCookie(request, ANALYTICS_EXCLUSION_COOKIE)
  const expected = signature()
  if (!token || !expected) return false
  const [version, provided, ...rest] = token.split('.')
  if (version !== VERSION || !provided || rest.length) return false
  const left = Buffer.from(provided)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export const exclusionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 400 * 24 * 60 * 60,
}
