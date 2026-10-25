import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

const pages = ['app/building-and-pest-inspections/page.tsx', 'app/pre-purchase-building-inspection/page.tsx']

test('Google Ads landing pages show the price link in the first screen, mid-page and on phones', async () => {
  for (const path of pages) {
    const page = await source(path)
    assert.match(page, /<HeroPriceCta \/>/, path)
    assert.match(page, /<InlinePriceCta \/>/, path)
    assert.match(page, /<MobilePriceBar \/>/, path)
    assert.ok(page.indexOf('<HeroPriceCta />') < page.indexOf('page-hero-aside'), `${path}: in the hero, before the aside`)
  }
})

test('the price link opens the quote at the property step and no price is published', async () => {
  const cta = await source('components/price-cta.tsx')
  assert.match(cta, /PRICE_HREF = '\/quote\?service=building-and-pest'/)
  assert.doesNotMatch(cta, /\$\s?\d/, 'no dollar amount on the page')
  assert.match(cta, /CONTACT_PHONE_HREF/)
})

test('the registration line links to the credentials page without the class wording', async () => {
  const cta = await source('components/price-cta.tsx')
  assert.match(cta, /href="\/credentials"/)
  assert.match(cta, /Registered Building Inspector · \{INSPECTOR_REGISTRATION\}/)
  assert.doesNotMatch(cta, /\(Limited\)/)
})

test('the phone bar is hidden above 840px and leaves room for the footer', async () => {
  const css = await source('app/globals.css')
  assert.match(css, /\.mobile-price-bar,\s*\.mobile-price-spacer \{\s*display: none;/)
  assert.match(css, /\.mobile-price-bar \{\s*position: fixed;/)
  assert.match(css, /env\(safe-area-inset-bottom\)/)
})
