import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

const ads = await import('../lib/google-ads.ts')

const day = 86_400_000
const now = Date.UTC(2026, 9, 18)
const site = 'https://homeaudit.com.au'

test('Google Ads account and quote conversion are configured', () => {
  assert.equal(ads.GOOGLE_ADS_ID, 'AW-18520017169')
  assert.equal(ads.GOOGLE_ADS_QUOTE_LABEL, 'vEi7CLqj96AdEJGShP9E')
  assert.equal(ads.isGoogleAdsId(ads.GOOGLE_ADS_ID), true)
  assert.equal(ads.isGoogleAdsId('G-ABC123'), false)
})

test('click ids: gclid first, then gbraid and wbraid with a prefix', () => {
  assert.equal(ads.clickIdFrom(new URLSearchParams('gclid=abc&gbraid=x')), 'abc')
  assert.equal(ads.clickIdFrom(new URLSearchParams('gbraid=g1')), 'gbraid:g1')
  assert.equal(ads.clickIdFrom(new URLSearchParams('wbraid=w1')), 'wbraid:w1')
  assert.equal(ads.clickIdFrom(new URLSearchParams('utm_source=google')), '')
})

test('the first page of a visit is saved, including an ad click', () => {
  const result = ads.nextAdAttribution(
    null,
    `${site}/building-and-pest-inspections?gclid=TEST123&utm_source=google&utm_medium=cpc&utm_campaign=bp_frankston_peninsula&utm_term=building%20and%20pest%20inspection`,
    'https://www.google.com/',
    now,
  )
  assert.equal(result.save, true)
  assert.equal(result.attribution.google_click_id, 'TEST123')
  assert.equal(result.attribution.utm_campaign, 'bp_frankston_peninsula')
  assert.equal(result.attribution.utm_term, 'building and pest inspection')
  assert.match(result.attribution.first_landing_url, /\/building-and-pest-inspections\?gclid=TEST123/)
  assert.equal(result.attribution.first_referrer, 'https://www.google.com/')
})

test('moving on to the quote page keeps the saved ad click', () => {
  const first = ads.nextAdAttribution(null, `${site}/frankston?gclid=TEST123`, '', now).attribution
  const later = ads.nextAdAttribution(
    { ...first, saved_at: now },
    `${site}/quote?service=building-and-pest`,
    `${site}/frankston`,
    now + 60_000,
  )
  assert.equal(later.save, false)
  assert.equal(later.attribution.google_click_id, 'TEST123')
  assert.match(later.attribution.first_landing_url, /\/frankston/)
})

test('a new ad click replaces an earlier source', () => {
  const organic = ads.nextAdAttribution(null, `${site}/`, 'https://www.google.com/', now).attribution
  const next = ads.nextAdAttribution(
    { ...organic, saved_at: now },
    `${site}/building-and-pest-inspections?gclid=NEW1`,
    '',
    now + 3 * day,
  )
  assert.equal(next.save, true)
  assert.equal(next.attribution.google_click_id, 'NEW1')
})

test('a saved source is forgotten after 90 days', () => {
  const old = ads.nextAdAttribution(null, `${site}/?gclid=OLD`, '', now).attribution
  const next = ads.nextAdAttribution({ ...old, saved_at: now }, `${site}/`, '', now + 91 * day)
  assert.equal(next.save, true)
  assert.equal(next.attribution.google_click_id, '')
})

test('a broken saved value or address never throws', () => {
  const result = ads.nextAdAttribution(null, 'not a url', '', now)
  assert.equal(result.attribution.google_click_id, '')
})

test('the conversion is reported without a browser tag as a no-op', async () => {
  await ads.reportQuoteConversion('HA-TEST')
})

test('quote form reports existing-home quotes with a reference only', async () => {
  const flow = await source('components/quote-flow.tsx')
  assert.match(flow, /draft\.service_family === 'existing_home' && result\.reference/)
  assert.match(flow, /await reportQuoteConversion\(result\.reference\)/)
  assert.doesNotMatch(flow, /function captureAttribution/)
})

test('building-and-pest links open at the property step', async () => {
  const page = await source('app/quote/page.tsx')
  assert.match(page, /initialInspectionType=\{service === 'building-and-pest' \? 'building_and_pest' : ''\}/)
  const flow = await source('components/quote-flow.tsx')
  assert.match(flow, /if \(presetType\) setStep\(1\)/)
})

test('ad attribution is captured on every public page', async () => {
  const tracker = await source('components/visitor-tracker.tsx')
  assert.match(tracker, /captureAdAttribution\(\)/)
})

test('Google Ads loads only in production and is allowed by the CSP', async () => {
  const analytics = await source('components/analytics.tsx')
  assert.match(analytics, /isVercelProduction && isGoogleAdsId\(GOOGLE_ADS_ID\)/)
  const config = await source('next.config.ts')
  assert.match(config, /https:\/\/www\.googleadservices\.com/)
  assert.match(config, /https:\/\/td\.doubleclick\.net/)
})

test('privacy page discloses the Google tag', async () => {
  const privacy = await source('app/privacy/page.tsx')
  assert.match(privacy, /<h2>Google Ads<\/h2>/)
  assert.doesNotMatch(privacy, /do not use advertising cookies/)
})

test('ad visits are labelled google_ads in visitor statistics', async () => {
  assert.deepEqual(ads.visitSource(new URLSearchParams('gclid=abc')), {
    utmSource: 'google_ads',
    utmMedium: 'cpc',
  })
  assert.equal(ads.visitSource(new URLSearchParams('gbraid=x&utm_source=google')).utmSource, 'google_ads')
  assert.deepEqual(ads.visitSource(new URLSearchParams('utm_source=newsletter&utm_medium=email')), {
    utmSource: 'newsletter',
    utmMedium: 'email',
  })
  assert.deepEqual(ads.visitSource(new URLSearchParams('')), { utmSource: '', utmMedium: '' })
  const client = await source('lib/visitor-analytics.ts')
  assert.match(client, /const \{ utmSource, utmMedium \} = visitSource\(params\)/)
})
