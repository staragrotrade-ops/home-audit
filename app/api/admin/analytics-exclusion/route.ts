import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdminRequest } from '@/lib/admin-session'
import {
  ANALYTICS_EXCLUSION_COOKIE,
  createExclusionToken,
  exclusionCookieOptions,
  isExcludedRequest,
} from '@/lib/analytics-exclusion'
import { isSameOriginMutation } from '@/lib/request-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const noStore = { 'Cache-Control': 'no-store' }

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false }, { status: 401, headers: noStore })
  return NextResponse.json({ ok: true, excluded: isExcludedRequest(request) }, { headers: noStore })
}

// Marks (or unmarks) this browser as the owner's, so its visits and quote
// tests are not counted as customer activity.
export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ ok: false }, { status: 401, headers: noStore })
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ ok: false, error: 'Invalid request origin.' }, { status: 403, headers: noStore })
  }

  const parsed = z.object({ excluded: z.boolean() }).safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400, headers: noStore })
  }

  const response = NextResponse.json({ ok: true, excluded: parsed.data.excluded }, { headers: noStore })
  if (parsed.data.excluded) {
    response.cookies.set(ANALYTICS_EXCLUSION_COOKIE, createExclusionToken(), exclusionCookieOptions)
  } else {
    response.cookies.set(ANALYTICS_EXCLUSION_COOKIE, '', { ...exclusionCookieOptions, maxAge: 0 })
  }
  return response
}
