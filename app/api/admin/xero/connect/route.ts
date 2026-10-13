import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-session'
import { getXeroAuthorisationUrl } from '@/lib/xero'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Sends the owner to Xero to approve the connection.
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.redirect(new URL('/admin/login', request.url), 303)
  try {
    const state = randomUUID()
    const response = NextResponse.redirect(getXeroAuthorisationUrl(state), 303)
    response.cookies.set('ha_xero_state', state, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/admin/xero',
      maxAge: 600,
    })
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Xero is not set up.'
    return NextResponse.redirect(new URL(`/admin?xero=${encodeURIComponent(message)}#settings`, request.url), 303)
  }
}
