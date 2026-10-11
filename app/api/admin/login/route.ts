import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  createAdminSessionToken,
  isAdminConfigured,
  verifyAdminPassword,
} from '@/lib/admin-session'
import { clientHash } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

function back(request: Request, query: string) {
  return NextResponse.redirect(new URL(`/admin/login${query}`, request.url), 303)
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) return new NextResponse(null, { status: 404 })

  // Slow down password guessing: 10 attempts per 15 minutes per client.
  const supabase = getSupabaseAdmin()
  if (supabase) {
    const { data: allowed } = await supabase.rpc('consume_rate_limit', {
      p_bucket: 'admin_login',
      p_client_hash: clientHash(request, 'admin_login'),
      p_window_seconds: 900,
      p_max_hits: 10,
    })
    if (allowed === false) return back(request, '?error=locked')
  }

  let password = ''
  let remember = false
  try {
    const form = await request.formData()
    password = String(form.get('password') || '').slice(0, 200)
    remember = form.get('remember') === 'on'
  } catch {
    return back(request, '?error=1')
  }

  if (!verifyAdminPassword(password)) return back(request, '?error=1')

  const response = NextResponse.redirect(new URL('/admin', request.url), 303)
  response.cookies.set(ADMIN_COOKIE, createAdminSessionToken(remember), adminCookieOptions(remember))
  return response
}
