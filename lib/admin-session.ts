// Server-only. One shared admin password, checked against an environment
// variable, and an HMAC-signed session cookie. The admin area stays switched
// off (404) until both variables are set.
import { createHmac, timingSafeEqual } from 'node:crypto'

export const ADMIN_COOKIE = 'ha_admin_session'
const TTL_SECONDS = 12 * 60 * 60
export const REMEMBER_TTL_SECONDS = 90 * 24 * 60 * 60

function sessionSecret() {
  const value = process.env.ADMIN_SESSION_SECRET
  return value && value.length >= 24 ? value : null
}

function adminPassword() {
  const value = process.env.ADMIN_DASHBOARD_PASSWORD
  return value && value.length >= 10 ? value : null
}

export function isAdminConfigured() {
  return Boolean(sessionSecret() && adminPassword())
}

function sign(payload: string) {
  const secret = sessionSecret()
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured.')
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function createAdminSessionToken(remember = false) {
  const expires =
    Math.floor(Date.now() / 1000) + (remember ? REMEMBER_TTL_SECONDS : TTL_SECONDS)
  const payload = `admin.${expires}`
  return `${payload}.${sign(payload)}`
}

export function verifyAdminSessionToken(token?: string | null) {
  if (!token || !isAdminConfigured()) return false
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== 'admin') return false
  const expires = Number(parts[1])
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false
  try {
    return safeEqual(parts[2], sign(`${parts[0]}.${parts[1]}`))
  } catch {
    return false
  }
}

export function verifyAdminPassword(password: string) {
  const expected = adminPassword()
  if (!expected || !sessionSecret()) return false
  return safeEqual(password, expected)
}

export function adminCookieOptions(remember: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: remember ? REMEMBER_TTL_SECONDS : TTL_SECONDS,
  }
}

export function readCookie(request: Request, name: string) {
  const header = request.headers.get('cookie') || ''
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index < 0 || part.slice(0, index).trim() !== name) continue
    const raw = part.slice(index + 1).trim()
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  return null
}

export function isAdminRequest(request: Request) {
  return verifyAdminSessionToken(readCookie(request, ADMIN_COOKIE))
}
