import assert from 'node:assert/strict'
import test from 'node:test'
import { quoteRequestSchema } from '../lib/quote-schema.ts'

const base = {
  property_address: '10 Example Street, Melbourne VIC',
  suburb: 'Melbourne',
  postcode: '3000',
  property_type: 'house',
  storeys: '1',
  bedrooms: '3',
  bathrooms: '2',
  builder_name: '',
  expected_ready_date: '',
  first_name: 'Test',
  last_name: 'Customer',
  email: 'test@example.com',
  mobile: '0400000000',
  conveyancer_email: '',
  agent_email: '',
  preferred_date_1: '',
  preferred_date_2: '',
  deadline: '',
  flexible_booking: true,
  access_contact: '',
  access_notes: '',
  source_self_reported: 'google',
  attribution: {
    first_landing_url: 'https://homeaudit.com.au/',
    first_referrer: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
    google_click_id: '',
  },
  privacy_consent: true,
  website: '',
}

test('accepts an existing-home quote request', () => {
  const result = quoteRequestSchema.safeParse({
    ...base,
    service_family: 'existing_home',
    inspection_type: 'building_and_pest',
    new_home_stages: [],
  })
  assert.equal(result.success, true)
})

test('accepts a new-home quote request with a stage', () => {
  const result = quoteRequestSchema.safeParse({
    ...base,
    service_family: 'new_home',
    inspection_type: '',
    new_home_stages: ['frame'],
  })
  assert.equal(result.success, true)
})

test('rejects a new-home request without a stage', () => {
  const result = quoteRequestSchema.safeParse({
    ...base,
    service_family: 'new_home',
    inspection_type: '',
    new_home_stages: [],
  })
  assert.equal(result.success, false)
})

test('rejects unsupported service values and invalid dates', () => {
  const result = quoteRequestSchema.safeParse({
    ...base,
    service_family: 'existing_home',
    inspection_type: 'unknown_scope',
    new_home_stages: [],
    preferred_date_1: '19/09/2026',
  })

  assert.equal(result.success, false)
})

test('rejects a request without privacy consent', () => {
  const result = quoteRequestSchema.safeParse({
    ...base,
    service_family: 'existing_home',
    inspection_type: 'building_and_pest',
    new_home_stages: [],
    privacy_consent: false,
  })

  assert.equal(result.success, false)
})
