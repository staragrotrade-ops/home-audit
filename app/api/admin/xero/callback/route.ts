import { NextResponse } from 'next/server'
import { isAdminRequest, readCookie } from '@/lib/admin-session'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { exchangeXeroCode, getXeroConnections, saveXeroConnection } from '@/lib/xero'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Xero sends the owner back here after they approve the connection.
export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.redirect(new URL('/admin/login', request.url), 303)
  const back = (message: string) => {
    const response = NextResponse.redirect(
      new URL(`/admin?xero=${encodeURIComponent(message)}#settings`, request.url),
      303,
    )
    response.cookies.set('ha_xero_state', '', { path: '/api/admin/xero', maxAge: 0 })
    return response
  }

  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    if (!code || !state || state !== readCookie(request, 'ha_xero_state')) {
      return back('The Xero sign-in was not completed. Try again.')
    }
    const supabase = getSupabaseAdmin()
    if (!supabase) return back('The database is not configured.')

    const token = await exchangeXeroCode(code)
    const tenants = await getXeroConnections(token.access_token)
    const wanted = process.env.XERO_TENANT_ID?.trim()
    const tenant = wanted ? tenants.find((item) => item.tenantId === wanted) : tenants[0]
    if (!tenant) return back('No Xero organisation was approved. Try again and choose the organisation.')

    await saveXeroConnection(supabase, token, tenant)
    return back(`connected:${tenant.tenantName || 'Xero'}`)
  } catch (error) {
    return back(error instanceof Error ? error.message : 'Xero connection failed.')
  }
}
