// Server-only. A short-lived cookie set when the customer opens the Stripe
// payment page. On the way back, only the browser that started the payment is
// taken to the private order page; a bare Checkout session id is not enough.
import { createHmac, timingSafeEqual } from 'node:crypto'
import { readCookie } from '@/lib/admin-session'

export const ORDER_RETURN_COOKIE = 'ha_order_return'

function key() {
  return (
    process.env.ORDER_LINK_SECRET ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  )
}

function sign(jobId: string) {
  return createHmac('sha256', key()).update(`order-return:${jobId}`).digest('base64url')
}

export function orderReturnCookieValue(jobId: string) {
  return `${jobId}.${sign(jobId)}`
}

export function isOrderReturnFor(request: Request, jobId: string) {
  const value = readCookie(request, ORDER_RETURN_COOKIE)
  if (!value || !key()) return false
  const expected = orderReturnCookieValue(jobId)
  const left = Buffer.from(value)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export const orderReturnCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/order/return',
  maxAge: 2 * 24 * 60 * 60,
}
