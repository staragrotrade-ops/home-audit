import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import {
  checkVoucher,
  generateVoucherCode,
  normalizeVoucherCode,
  priceAfterVoucher,
  VOUCHER_AMOUNT_CENTS,
  voucherExpiry,
  type VoucherRow,
} from '../lib/voucher-rules.ts'

const read = (path: string) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

const voucher = (overrides: Partial<VoucherRow> = {}): VoucherRow => ({
  code: 'HA30-K7QM-2XDP',
  amount_cents: VOUCHER_AMOUNT_CENTS,
  expires_at: '2027-04-24T00:00:00.000Z',
  claimed_job_id: null,
  redeemed_at: null,
  cancelled_at: null,
  ...overrides,
})

test('the voucher is $30 including GST and lasts 6 months', () => {
  assert.equal(VOUCHER_AMOUNT_CENTS, 3000)
  assert.equal(voucherExpiry(new Date('2026-10-24T03:00:00Z')).toISOString(), '2027-04-24T03:00:00.000Z')
})

test('codes are easy to read out and typed codes are tidied', () => {
  const codes = new Set(Array.from({ length: 200 }, generateVoucherCode))
  assert.equal(codes.size, 200)
  for (const code of codes) assert.match(code, /^HA30-[A-HJKMNP-RT-Z2346-9]{4}-[A-HJKMNP-RT-Z2346-9]{4}$/)
  assert.equal(normalizeVoucherCode(' ha30 k7qm 2xdp '), 'HA30-K7QM-2XDP')
  assert.equal(normalizeVoucherCode('HA30K7QM2XDP'), 'HA30-K7QM-2XDP')
  assert.equal(normalizeVoucherCode('SAVE30'), '')
  assert.equal(normalizeVoucherCode(undefined), '')
})

test('a voucher works once, before it expires, and not after cancellation', () => {
  const now = new Date('2026-11-01T00:00:00Z')
  assert.deepEqual(checkVoucher(voucher(), 'job-1', now), { ok: true, amountCents: 3000 })
  assert.deepEqual(checkVoucher(null, 'job-1', now), { ok: false, reason: 'not_found' })
  assert.deepEqual(checkVoucher(voucher({ expires_at: '2026-10-31T00:00:00Z' }), 'job-1', now), { ok: false, reason: 'expired' })
  assert.deepEqual(checkVoucher(voucher({ redeemed_at: '2026-10-30T00:00:00Z' }), 'job-1', now), { ok: false, reason: 'used' })
  assert.deepEqual(checkVoucher(voucher({ claimed_job_id: 'job-2' }), 'job-1', now), { ok: false, reason: 'used' })
  assert.deepEqual(checkVoucher(voucher({ claimed_job_id: 'job-1' }), 'job-1', now), { ok: true, amountCents: 3000 })
  assert.deepEqual(checkVoucher(voucher({ cancelled_at: '2026-10-30T00:00:00Z' }), 'job-1', now), { ok: false, reason: 'cancelled' })
})

test('the voucher comes off the total and GST is worked out of what is left', () => {
  // $500 + $50 GST = $550 → $520, of which GST is $47.27.
  assert.deepEqual(priceAfterVoucher(50_000, 5_000, 3_000), {
    subtotalCents: 47_273,
    gstCents: 4_727,
    totalCents: 52_000,
    discountCents: 3_000,
  })
  assert.deepEqual(priceAfterVoucher(50_000, 5_000, 0), {
    subtotalCents: 50_000,
    gstCents: 5_000,
    totalCents: 55_000,
    discountCents: 0,
  })
  assert.equal(priceAfterVoucher(1_000, 100, 3_000).totalCents, 0)
})

test('the code is applied to online quotes, manual prices and the order page, and redeemed on payment', () => {
  const quote = read('app/api/quote/route.ts')
  assert.match(quote, /claimVoucherForJob\(supabase, jobId, voucherCode\)/)
  assert.match(quote, /priceAfterVoucher\(pricing\.subtotalCents, pricing\.gstCents, voucherCents\)/)
  assert.match(read('app/api/admin/jobs/[id]/quote/route.ts'), /priceAfterVoucher\(/)
  assert.match(read('lib/orders.ts'), /await redeemJobVoucher\(supabase, jobId\)/)
  assert.match(read("app/order/[token]/page.tsx"), /voucher_discount_cents/)
  const flow = read('components/quote-flow.tsx')
  assert.match(flow, /\{t\.voucherLabel\}/)
  assert.match(read('lib/quote-copy.ts'), /Voucher code \(optional\)/)
  assert.match(flow, /Voucher code: \$\{draft\.voucher_code\}/)
})

test('only the 137B website can issue codes, with a long shared secret', () => {
  const store = read('lib/vouchers.ts')
  assert.match(store, /VOUCHER_ISSUE_SECRET/)
  assert.match(store, /secret\.length < 32/)
  assert.match(store, /timingSafeEqual/)
  assert.match(read('app/api/vouchers/issue/route.ts'), /isVoucherIssuer\(request\)/)
  const migration = read('supabase/migrations/20261024120000_vouchers.sql')
  assert.match(migration, /enable row level security/)
  assert.match(migration, /vouchers_source_reference_key/)
})
