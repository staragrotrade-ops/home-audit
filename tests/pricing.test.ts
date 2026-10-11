import assert from 'node:assert/strict'
import test from 'node:test'
import { addBusinessDays, isBusinessDay } from '../lib/business-days.ts'
import { earliestInstantDate, priceQuote, type PricingInput } from '../lib/pricing.ts'

const today = '2026-10-09' // a Friday

const instant: PricingInput = {
  serviceFamily: 'existing_home',
  inspectionType: 'building_and_pest',
  priceGuideBand: 'up_to_1_5m',
  preferredDate: '2026-10-20',
  deadline: '',
  travelMinutes: 55,
  today,
}

test('business days skip weekends and Victorian public holidays', () => {
  assert.equal(addBusinessDays('2026-10-09', 3), '2026-10-14')
  assert.equal(isBusinessDay('2026-11-03'), false, 'Melbourne Cup')
  assert.equal(addBusinessDays('2026-10-30', 3), '2026-11-05')
  assert.equal(addBusinessDays('2026-12-23', 3), '2026-12-30')
  assert.equal(earliestInstantDate(today), '2026-10-14')
})

test('a standard job gets the $550 instant price', () => {
  const result = priceQuote(instant)
  assert.equal(result.decision, 'instant')
  assert.equal(result.decision === 'instant' && result.totalCents, 55_000)
  assert.equal(result.decision === 'instant' && result.gstCents, 5_000)
  for (const type of ['building_only', 'pre_auction']) {
    assert.equal(priceQuote({ ...instant, inspectionType: type }).decision, 'instant')
  }
  assert.equal(priceQuote({ ...instant, preferredDate: '', travelMinutes: 90 }).decision, 'instant')
  assert.equal(priceQuote({ ...instant, preferredDate: '2026-10-14' }).decision, 'instant')
})

test('anything outside the rules goes to a price review', () => {
  const cases: [Partial<PricingInput>, RegExp][] = [
    [{ serviceFamily: 'new_home' }, /New home/],
    [{ priceGuideBand: 'over_1_5m' }, /over \$1\.5m/],
    [{ priceGuideBand: 'unknown' }, /not known/],
    [{ priceGuideBand: '' }, /not known/],
    [{ travelMinutes: 91 }, /drive from Mount Eliza/],
    [{ travelMinutes: null }, /could not be checked/],
    [{ preferredDate: '2026-10-13' }, /within 3 business days/],
    [{ deadline: '2026-10-12' }, /Deadline/],
  ]
  for (const [change, reason] of cases) {
    const result = priceQuote({ ...instant, ...change })
    assert.equal(result.decision, 'manual', JSON.stringify(change))
    assert.match(result.reasons.join(' '), reason)
  }
})
