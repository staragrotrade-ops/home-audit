import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-session'
import { getGoogleAuthorisationUrl } from '@/lib/google-calendar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Sends the owner to Google to allow calendar access.
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.redirect(new URL('/admin/login', request.url), 303)
  try {
    const state = randomUUID()
    const response = NextResponse.redirect(getGoogleAuthorisationUrl(state), 303)
    response.cookies.set('ha_google_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/admin/google',
      maxAge: 600,
    })
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Google Calendar is not set up.'
    return NextResponse.redirect(new URL(`/admin?google=${encodeURIComponent(message)}#settings`, request.url), 303)
  }
}
