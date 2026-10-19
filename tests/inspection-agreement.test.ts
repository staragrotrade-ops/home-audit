import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

const a = await import('../lib/inspection-agreement.ts')

test('inspection agreement: any change to the wording needs a new version', () => {
  const sha = createHash('sha256').update(a.agreementPlainText(), 'utf8').digest('hex')
  assert.match(a.AGREEMENT_VERSION, /^\d{4}-\d{2}-\d{2}$/)
  assert.equal(
    a.AGREEMENT_FINGERPRINTS[a.AGREEMENT_VERSION],
    sha,
    `The agreement text changed. Set a new AGREEMENT_VERSION and record its fingerprint: ${sha}`,
  )
})

test('inspection agreement: scope, exclusions, cancellation and limitation of liability', () => {
  const text = a.agreementPlainText()
  for (const heading of ['Scope of the inspection', 'What is not included', 'Cancelling or changing', 'Limitation of liability']) {
    assert.ok(a.AGREEMENT_SECTIONS.some((section: { heading: string }) => section.heading.includes(heading)), heading)
  }
  assert.match(text, /AS 4349\.1-2007/)
  assert.match(text, /AS 4349\.3-2010/)
  assert.match(text, /within 30 metres of the main building/)
  assert.match(text, /Australian Consumer Law/)
  assert.match(text, /limited to the fee you paid/)
  // Owner decision: the written report counts, not spoken comments; 15 minutes of phone time.
  assert.match(text, /Spoken comments are not guaranteed to be complete or accurate/)
  assert.match(text, /up to 15 minutes of phone time/)
  assert.match(text, /Time beyond 15 minutes is charged/)
  // Owner decision: access that needs a tool to open is not accessible.
  assert.match(text, /Any access that needs a tool to open is treated as not accessible/)
  // Owner decisions: the report is an opinion and advice, not the only basis to buy, negotiate or value.
  assert.match(text, /the report is the inspector’s opinion/)
  assert.match(text, /not a full list of every problem/)
  assert.match(text, /may be different from the actual condition/)
  assert.match(text, /must not be used on its own as the only basis for deciding to buy the property, negotiating the price or valuing the property/)
  assert.match(text, /how much risk you are willing to accept, are your own/)
  assert.match(text, /If you do not agree with it, please do not book our service/)
  // Owner decisions: digital copy; no inspector name; no "tell us before repairs" clause.
  assert.match(text, /We provide the report as a digital copy/)
  assert.match(text, /download from our website/)
  assert.doesNotMatch(text, /We send the report by email/)
  assert.doesNotMatch(text, /IN-L|Xiaoqiong|carried out by/)
  assert.doesNotMatch(text, /before repairs start/)
  // From AS 4349.1: subjective appraisal, acceptance criteria, tool access, no cost estimates.
  assert.match(text, /Different inspectors, or the same inspector on another day, may reach different conclusions/)
  assert.match(text, /similar age and type/)
  assert.match(text, /removing screws, bolts, other fastenings or sealants/)
  assert.match(text, /estimates of repair costs/)
  // Owner decision: $100 if cancelled 3+ business days ahead; no refund after that.
  assert.equal(a.CANCELLATION_FEE_CENTS, 10_000)
  assert.equal(a.CANCELLATION_NOTICE_BUSINESS_DAYS, 3)
  assert.match(text, /3 or more business days before the inspection date, we refund the fee less a \$100 cancellation fee/)
  assert.match(text, /less than 3 business days before the inspection date, the fee is not refunded/)
  // No report turnaround promise (owner decision).
  assert.doesNotMatch(text, /within \d+ (business )?(hours|days) of the inspection/)
  // The key points shown above the tick box match the full text.
  assert.match(a.AGREEMENT_KEY_POINTS.join(' '), /\$100/)
  assert.equal(a.agreementVersionLabel('2026-10-19'), '19 October 2026')
})

test('inspection agreement: accepted before payment, recorded once, required for booking details', async () => {
  const checkout = await source('app/api/order/[token]/checkout/route.ts')
  assert.match(checkout, /loadAgreementStatus\(supabase, job\.id\)/)
  assert.match(checkout, /accept the Inspection Agreement before paying/)
  assert.match(checkout, /agreement_version: agreement\.version/)
  assert.ok(checkout.indexOf('loadAgreementStatus(supabase') < checkout.indexOf("from('payments')"))

  const details = await source('app/api/order/[token]/details/route.ts')
  assert.match(details, /loadAgreementStatus\(supabase, job\.id\)\)\.accepted/)

  const route = await source('app/api/order/[token]/agreement/route.ts')
  assert.match(route, /isSameOriginMutation\(request\)/)
  assert.match(route, /agreed: z\.literal\(true\)/)
  assert.match(route, /version !== AGREEMENT_VERSION/)

  const store = await source('lib/agreement-store.ts')
  assert.match(store, /\.is\('agreement_accepted_at', null\)/)
  assert.match(store, /event_type: 'agreement_accepted'/)

  const order = await source('app/order/[token]/page.tsx')
  assert.match(order, /mode="pay"/)
  assert.match(order, /mode="accept"/)
  assert.doesNotMatch(order, /PayButton/)
  const consent = await source('components/order/agreement-consent.tsx')
  assert.match(consent, /type="checkbox"/)
  assert.match(consent, /if \(!agreed\)/)
  assert.ok(consent.indexOf("post('agreement'") < consent.indexOf("post('checkout')"))

  const sql = await source('supabase/migrations/20261019100000_inspection_agreement.sql')
  assert.match(sql, /add column if not exists agreement_version text/)
  assert.match(sql, /add column if not exists agreement_sha256 text/)
  assert.match(sql, /add column if not exists agreement_accepted_at timestamptz/)
})
