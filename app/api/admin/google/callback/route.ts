import { NextResponse } from 'next/server'
import { isAdminRequest, readCookie } from '@/lib/admin-session'
import { connectGoogleCalendar } from '@/lib/google-calendar'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Google sends the owner back here after they allow calendar access.
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.redirect(new URL('/admin/login', request.url), 303)
  const back = (message: string) => {
    const response = NextResponse.redirect(
      new URL(`/admin?google=${encodeURIComponent(message)}#settings`, request.url),
      303,
    )
    response.cookies.set('ha_google_state', '', { path: '/api/admin/google', maxAge: 0 })
    return response
  }
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    if (url.searchParams.get('error')) return back('Google access was not allowed. Try again.')
    if (!code || !state || state !== readCookie(request, 'ha_google_state')) {
      return back('The Google sign-in was not completed. Try again.')
    }
    const supabase = getSupabaseAdmin()
    if (!supabase) return back('The database is not configured.')
    const email = await connectGoogleCalendar(supabase, code)
    return back(`connected:${email}`)
  } catch (error) {
    return back(error instanceof Error ? error.message : 'Google Calendar connection failed.')
  }
}
