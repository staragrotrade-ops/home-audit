// Building & Pest voucher rules (owner decision 2026-10-24): $30 including
// GST off a Home Audit inspection, valid for 6 months, one use per code,
// issued by the 137B website to its customers. Pure functions only, so they
// can be tested without a database.
import { randomInt } from 'node:crypto'

export const VOUCHER_AMOUNT_CENTS = 3_000
export const VOUCHER_VALID_MONTHS = 6
export const VOUCHER_PREFIX = 'HA30'

// No 0/O, 1/I/L or 5/S, so a code read out over the phone is not misheard.
const ALPHABET = 'ABCDEFGHJKMNPQRTUVWXYZ2346789'

/** A new random code such as HA30-K7QM-2XDP (about 39 bits of randomness). */
export function generateVoucherCode() {
  const pick = () => ALPHABET[randomInt(ALPHABET.length)]
  const group = () => Array.from({ length: 4 }, pick).join('')
  return `${VOUCHER_PREFIX}-${group()}-${group()}`
}

/** What the customer typed, in the stored form, or '' when it cannot be a code. */
export function normalizeVoucherCode(input: unknown) {
  if (typeof input !== 'string') return ''
  const compact = input.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!/^HA30[A-Z0-9]{8}$/.test(compact)) return ''
  return `${compact.slice(0, 4)}-${compact.slice(4, 8)}-${compact.slice(8, 12)}`
}

/** The expiry date, VOUCHER_VALID_MONTHS calendar months after issue. */
export function voucherExpiry(issuedAt: Date) {
  const expires = new Date(issuedAt)
  expires.setUTCMonth(expires.getUTCMonth() + VOUCHER_VALID_MONTHS)
  return expires
}

export type VoucherRow = {
  code: string
  amount_cents: number
  expires_at: string
  claimed_job_id: string | null
  redeemed_at: string | null
  cancelled_at: string | null
}

export type VoucherCheck =
  | { ok: true; amountCents: number }
  | { ok: false; reason: 'not_found' | 'expired' | 'used' | 'cancelled' }

/** Whether a stored voucher can still be used on the given job. */
export function checkVoucher(voucher: VoucherRow | null, jobId: string, now = new Date()): VoucherCheck {
  if (!voucher) return { ok: false, reason: 'not_found' }
  if (voucher.cancelled_at) return { ok: false, reason: 'cancelled' }
  if (voucher.redeemed_at) return { ok: false, reason: 'used' }
  if (voucher.claimed_job_id && voucher.claimed_job_id !== jobId) return { ok: false, reason: 'used' }
  if (new Date(voucher.expires_at).getTime() <= now.getTime()) return { ok: false, reason: 'expired' }
  return { ok: true, amountCents: voucher.amount_cents }
}

export const VOUCHER_REASON_TEXT: Record<Exclude<VoucherCheck, { ok: true }>['reason'], string> = {
  not_found: 'not recognised',
  expired: 'expired',
  used: 'already used',
  cancelled: 'cancelled',
}

/**
 * The price after the voucher. The voucher comes off the GST-inclusive total
 * and GST is worked back out of what is left, so the invoice still adds up.
 */
export function priceAfterVoucher(subtotalCents: number, gstCents: number, voucherCents: number) {
  const before = subtotalCents + gstCents
  const discount = Math.max(0, Math.min(voucherCents, before))
  const totalCents = before - discount
  const afterSubtotal = Math.round((totalCents * 10) / 11)
  return {
    subtotalCents: afterSubtotal,
    gstCents: totalCents - afterSubtotal,
    totalCents,
    discountCents: discount,
  }
}
