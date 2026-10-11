import { NextResponse } from 'next/server'
import { ADMIN_COOKIE } from '@/lib/admin-session'
import { isSameOriginMutation } from '@/lib/request-guard'

export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return new NextResponse(null, { status: 403 })
  const response = NextResponse.redirect(new URL('/admin/login', request.url), 303)
  response.cookies.set(ADMIN_COOKIE, '', { path: '/', maxAge: 0 })
  return response
}
