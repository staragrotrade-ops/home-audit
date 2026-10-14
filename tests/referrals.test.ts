import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

const r = await import('../lib/referrals.ts')

const jane = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Jane Smith',
  agency: 'ABC Conveyancing',
  branch: 'Frankston',
  ref_code: 'jsab2',
  status: 'active',
  commission_type: 'fixed' as const,
  commission_cents: 5000,
  commission_percent: null,
}
const bob = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Bob Lee',
  ref_code: 'blx9q',
  status: 'active',
  commission_type: 'percent' as const,
  commission_cents: null,
  commission_percent: '10',
}

test('codes: initials plus a short suffix, only lower-case letters and digits', () => {
  assert.equal(r.referrerCodeBase('Jane Smith'), 'js')
  assert.equal(r.referrerCodeBase('Zoë'), 'z')
  assert.equal(r.referrerCodeBase('  '), 'r')
  assert.equal(r.codeSuffix([0, 30, 31]).length, 3)
  assert.equal(r.normaliseRefCode(' JSab2 '), 'jsab2')
  assert.equal(r.normaliseRefCode('js'), null)
  assert.equal(r.normaliseRefCode('a<script>'), null)
  assert.equal(r.referralLink('https://homeaudit.com.au/', 'jsab2'), 'https://homeaudit.com.au/?ref=jsab2')
})

test('commission: fixed per paid job, or a percentage of the fee excluding GST', () => {
  assert.equal(r.commissionForJob(jane, 50000), 5000)
  assert.equal(r.commissionForJob(bob, 50000), 5000)
  assert.equal(r.commissionForJob(null, 50000), null)
  assert.equal(r.exGstCents(55000), 50000)
  assert.deepEqual(r.commissionColumns('fixed', '$50'), { commission_type: 'fixed', commission_cents: 5000, commission_percent: null })
  assert.deepEqual(r.commissionColumns('percent', '12.5%'), { commission_type: 'percent', commission_cents: null, commission_percent: 12.5 })
  assert.deepEqual(r.commissionColumns('', ''), { commission_type: null, commission_cents: null, commission_percent: null })
  assert.throws(() => r.commissionColumns('percent', '120'))
  assert.throws(() => r.commissionColumns('fixed', 'abc'))
  assert.equal(r.commissionLabel(jane), '$50.00 per paid job')
  assert.equal(r.commissionLabel(bob), '10% of fee (excl. GST)')
})

test('who referred a job: owner override first, then the link', () => {
  const byId = new Map([jane, bob].map((x) => [x.id, x]))
  const byCode = new Map([jane, bob].map((x) => [x.ref_code, x]))
  assert.equal(r.effectiveReferral({ ref_code: 'jsab2' }, byId, byCode).referrer?.name, 'Jane Smith')
  assert.equal(r.effectiveReferral({ ref_code: 'jsab2', referrer_override_id: bob.id }, byId, byCode).source, 'manual')
  assert.equal(r.effectiveReferral({ ref_code: 'jsab2', referrer_override_none: true }, byId, byCode).source, 'none')
  assert.equal(r.effectiveReferral({ ref_code: 'zzz99' }, byId, byCode).referrer, null)
})

test('monthly statement: paid jobs, quotes, visits and commission per referrer; tests excluded', () => {
  const rows = r.buildReferralStatement({
    referrers: [jane, bob],
    paidJobs: [
      { jobId: 'a', reference: 'HA-1', address: '1 A St', paidAt: '2026-10-02T01:00:00Z', feeInclGstCents: 55000, isTest: false, ref_code: 'jsab2' },
      { jobId: 'b', reference: 'HA-2', address: '2 B St', paidAt: '2026-10-03T01:00:00Z', feeInclGstCents: 55000, isTest: false, referrer_override_id: bob.id },
      { jobId: 'c', reference: 'HA-3', address: '3 C St', paidAt: '2026-10-04T01:00:00Z', feeInclGstCents: 55000, isTest: true, ref_code: 'jsab2' },
    ],
    quotes: [{ ref_code: 'jsab2' }, { ref_code: 'jsab2' }, { referrer_override_id: bob.id }, { ref_code: 'jsab2', isTest: true }],
    visitsByCode: new Map([['jsab2', 7]]),
  })
  const janeRow = rows.find((row) => row.referrer?.id === jane.id)!
  const bobRow = rows.find((row) => row.referrer?.id === bob.id)!
  assert.equal(janeRow.visits, 7)
  assert.equal(janeRow.quotes, 2)
  assert.equal(janeRow.paidJobs, 1)
  assert.equal(janeRow.successRate, 0.5)
  assert.equal(janeRow.commissionCents, 5000)
  assert.equal(bobRow.commissionCents, 5000)
  assert.equal(bobRow.jobs[0].source, 'manual')

  const csv = r.referralStatementCsv('2026-10', rows)
  assert.match(csv, /TOTAL/)
  assert.match(csv, /Jane Smith,ABC Conveyancing Frankston,jsab2/)
  assert.equal(r.referralStatementCsv('2026-10', [{ ...janeRow, label: '=cmd', referrer: null }]).includes(",'=cmd,"), true)
})

test('Melbourne months', () => {
  assert.deepEqual(r.melbourneMonthRange('2026-10'), { start: '2026-09-30T14:00:00.000Z', end: '2026-10-31T13:00:00.000Z' })
  assert.equal(r.melbourneMonthKey('2026-10-31T13:30:00Z'), '2026-11')
  assert.equal(r.recentMonthKeys(new Date('2026-01-15T00:00:00Z'), 2).join(), '2026-01,2025-12')
  assert.throws(() => r.melbourneMonthRange('2026-13'))
})

test('referral data stays private and the registration page stays low-key', async () => {
  const sql = await source('supabase/migrations/20261015100000_referrers.sql')
  assert.match(sql, /enable row level security/)
  assert.match(sql, /revoke all on table public\.referrers from anon, authenticated/)

  const register = await source('app/api/referrers/register/route.ts')
  assert.match(register, /isSameOriginMutation\(request\)/)
  assert.match(register, /verifyTurnstile\(input\.turnstileToken, request, 'partner'\)/)
  assert.match(register, /consume_rate_limit/)
  assert.match(register, /status: 'pending'/)

  const page = await source('app/partners/register/page.tsx')
  assert.match(page, /robots: \{ index: false, follow: false/)
  const sitemap = await source('app/sitemap.ts')
  assert.doesNotMatch(sitemap, /partners/)
  const header = await source('components/site-header.tsx')
  assert.doesNotMatch(header, /partners/)

  for (const path of ['app/api/admin/referrers/route.ts', 'app/api/admin/referrers/statement/route.ts']) {
    assert.match(await source(path), /requireAdmin\(request/)
  }
})

test('the quote saves the referral code, and the customer sees who referred them', async () => {
  const quote = await source('app/api/quote/route.ts')
  assert.match(quote, /referralCodeFromRequest\(request, supabase\)/)
  const store = await source('lib/referral-store.ts')
  assert.match(store, /data\.status === 'disabled'\) return null/)
  const order = await source('app/order/[token]/page.tsx')
  assert.match(order, /Referred by \{referredBy\}/)
  const privacy = await source('app/privacy/page.tsx')
  assert.match(privacy, /Referral partners/)
})
