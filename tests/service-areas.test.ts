import assert from 'node:assert/strict'
import test from 'node:test'
import {
  SERVICE_AREAS,
  SERVICE_AREA_REGIONS,
  getNearbyServiceAreas,
  getServiceArea,
} from '../lib/service-areas.ts'

test('first service-area release contains 12 unique, complete locations', () => {
  assert.equal(SERVICE_AREAS.length, 12)
  assert.equal(new Set(SERVICE_AREAS.map((area) => area.slug)).size, 12)
  assert.equal(new Set(SERVICE_AREAS.map((area) => area.metaTitle)).size, 12)
  assert.equal(new Set(SERVICE_AREAS.map((area) => area.metaDescription)).size, 12)

  for (const area of SERVICE_AREAS) {
    assert.match(area.slug, /^[a-z]+(?:-[a-z]+)*$/)
    assert.match(area.postcode, /^\d{4}$/)
    assert.ok(area.hero.length >= 80, `${area.slug}: hero must be substantive`)
    assert.ok(area.summary.length >= 150, `${area.slug}: summary must be substantive`)
    assert.equal(area.localContext.length, 2, `${area.slug}: expected two local-context paragraphs`)
    assert.equal(area.priorities.length, 4, `${area.slug}: expected four local priorities`)
    assert.equal(area.faqs.length, 3, `${area.slug}: expected three local FAQs`)
    assert.equal(area.nearby.length, 4, `${area.slug}: expected four nearby links`)
    assert.ok(!area.nearby.includes(area.slug), `${area.slug}: must not link to itself as nearby`)
  }
})

test('all service-area relationships resolve to published locations', () => {
  for (const area of SERVICE_AREAS) {
    assert.equal(getServiceArea(area.slug), area)
    assert.equal(getNearbyServiceAreas(area).length, area.nearby.length)
  }
})

test('both launch clusters contain six service areas', () => {
  for (const region of SERVICE_AREA_REGIONS) {
    assert.equal(
      SERVICE_AREAS.filter((area) => area.region === region).length,
      6,
      `${region}: expected six areas`,
    )
  }
})

