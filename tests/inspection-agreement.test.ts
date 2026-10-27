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
  for (const heading of ['Scope of the Inspection', 'Exclusions', 'Cancellation and rescheduling', 'Limitation of liability']) {
    assert.ok(a.AGREEMENT_SECTIONS.some((section: { heading: string }) => section.heading.includes(heading)), heading)
  }
  assert.match(text, /AS 4349\.1-2007/)
  assert.match(text, /AS 4349\.3-2010/)
  assert.match(text, /within 30 metres of the main building/)
  assert.match(text, /Australian Consumer Law/)
  assert.match(text, /limited to the amount of the Fee paid/)
  // Owner decision: access that needs a tool to open is not accessible.
  assert.match(text, /Any access that requires a tool to open is treated as not accessible/)
  // Owner decisions: the written report counts, not spoken comments; 15 minutes of phone time.
  assert.match(text, /must not rely on any oral statement made by the inspector/)
  assert.match(text, /Oral statements are not warranted to be complete or accurate/)
  assert.match(text, /up to 15 minutes of telephone discussion/)
  assert.match(text, /Time beyond 15 minutes is charged/)
  // Owner decisions: the report is an opinion and advice, not the sole basis to buy, negotiate or value.
  assert.match(text, /the Report is the inspector’s opinion/)
  assert.match(text, /not an exhaustive list of every defect/)
  assert.match(text, /may differ from the actual condition/)
  assert.match(text, /must not be relied upon as the sole basis for deciding whether to purchase the Property, negotiating the price or valuing the Property/)
  assert.match(text, /degree of risk the Client is willing to accept, remain solely the Client’s responsibility/)
  assert.match(text, /the Client must not book the Inspection/)
  // Owner decisions: digital copy; no inspector name; deleted sentences stay deleted.
  assert.match(text, /provides the Report in digital form/)
  assert.match(text, /available for download from the Company’s website/)
  assert.doesNotMatch(text, /We send the report by email/)
  assert.doesNotMatch(text, /IN-L|Xiaoqiong/)
  assert.doesNotMatch(text, /before repairs start/)
  assert.doesNotMatch(text, /torch|site records|added to or removed from the standard scope/)
  // From AS 4349.1: subjective appraisal, acceptance criteria, tool access, no cost estimates.
  assert.match(text, /Different inspectors, or the same inspector on a different occasion, may reach different conclusions/)
  assert.match(text, /similar age and type/)
  assert.match(text, /removing screws, bolts, other fastenings or sealants/)
  assert.match(text, /estimate of the cost of rectification/)
  // Owner decision: $100 if cancelled 3+ business days ahead; no refund after that.
  assert.equal(a.CANCELLATION_FEE_CENTS, 10_000)
  assert.equal(a.CANCELLATION_NOTICE_BUSINESS_DAYS, 3)
  assert.match(text, /cancels 3 or more Business Days before the Inspection Date, the Company will refund the Fee less a cancellation fee of \$100/)
  assert.match(text, /less than 3 Business Days before the Inspection Date, the Fee is not refunded/)
  // No report turnaround promise (owner decision).
  assert.doesNotMatch(text, /within \d+ (business )?(hours|days) of the inspection/i)
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

test('thermal case study does not promise thermal imaging on every inspection', async () => {
  const card = await source('components/case-study.tsx')
  assert.match(card, /Where conditions allow and it is necessary, our inspector may use thermal imaging as an extra check/)
  assert.match(card, /moisture meter confirmed water/)
  assert.match(card, /The buyer used it to renegotiate the price/)
  assert.match(card, /pink waterproof coating/)
  assert.match(await source('app/new-home-inspections/page.tsx'), /<HebelBaseCaseStudy \/>/)
  assert.match(await source('app/new-home-inspections/page.tsx'), /<FrameStudCaseStudy \/>/)
  assert.match(card, /fixed within a week/)
  assert.match(a.agreementPlainText(), /thermal imaging, unless the Order states that it is included/)
  const service = await source('app/building-and-pest-inspections/page.tsx')
  const home = await source('app/page.tsx')
  assert.match(service, /<ThermalCaseStudy \/>/)
  assert.match(home, /<ThermalCaseStudy variant="home" \/>/)
  assert.match(await source('app/pre-purchase-building-inspection/page.tsx'), /<ThermalCaseStudy \/>/)
})

test('report uses stay consistent with the agreement (not the sole basis)', async () => {
  const page = await source('app/building-and-pest-inspections/page.tsx')
  assert.match(page, /id="how-buyers-use-the-report"/)
  assert.match(page, /Together with quotes\s+from licensed tradespeople/)
  assert.match(page, /depends on its\s+wording, so ask your lawyer or conveyancer/)
  assert.match(page, /Use it together with\s+advice from your lawyer or conveyancer/)
  assert.match(page, /inconsistent with the report/)
  assert.doesNotMatch(page, /new damage/)
  const prePurchase = await source('app/pre-purchase-building-inspection/page.tsx')
  assert.match(prePurchase, /#how-buyers-use-the-report/)
})

test('inspection agreement: report copies may be sold; the client keeps their own copy (full text)', () => {
  const text = a.agreementPlainText()
  assert.match(text, /may provide the Report, or a copy of it, to any other person/)
  assert.match(text, /does not include the Client’s name or contact details/)
  assert.match(text, /must not sell, publish or give the Report/)
  assert.match(text, /responsible for downloading the Report promptly/)
  assert.match(text, /not obliged to store the Report, the photographs/)
  // Owner decision 27 Oct 2026: these stay in the full text, not the summary.
  assert.ok(!a.AGREEMENT_KEY_POINTS.some((point: string) => /keep your own copy|liability/i.test(point)))
  assert.match(text, /total liability to the Client/)
})

