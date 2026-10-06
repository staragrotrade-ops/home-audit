import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const response = NextResponse.next()
  const hostname = (request.headers.get('host') || request.nextUrl.hostname)
    .split(':')[0]
    .toLowerCase()

  if (
    hostname.endsWith('.vercel.app') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)'],
}
