// Server-only helpers for /api/admin routes.
import { randomBytes } from 'node:crypto'
import { isAdminRequest } from '@/lib/admin-session'
import { isSameOriginMutation } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export function adminJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function adminError(error: unknown, fallback: string, status = 400) {
  const message = error instanceof Error && error.message ? error.message : fallback
  return adminJson({ ok: false, error: message }, status)
}

// Returns the service-role client for a signed-in admin, or a Response to send.
export function requireAdmin(request: Request, mutation = true) {
  if (!isAdminRequest(request)) return adminJson({ ok: false, error: 'Sign in again.' }, 401)
  if (mutation && !isSameOriginMutation(request)) {
    return adminJson({ ok: false, error: 'Invalid request origin.' }, 403)
  }
  const supabase = getSupabaseAdmin()
  if (!supabase) return adminJson({ ok: false, error: 'The database is not configured.' }, 503)
  return supabase
}

export function temporaryPassword() {
  // 18 random bytes → 24 URL-safe characters; meets any reasonable policy.
  return `Ha-${randomBytes(18).toString('base64url')}`
}
