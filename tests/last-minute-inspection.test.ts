import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

const PAGE = 'app/last-minute-building-inspection-melbourne/page.tsx'

test('the last-minute page shows both prices with GST and states it is not AS 4349.1', async () => {
  const page = await source(PAGE)
  assert.match(page, /\$850 \+ GST/)
  assert.match(page, /\$935 incl\. GST/)
  assert.match(page, /\$1,100 \+ GST/)
  assert.match(page, /\$1,210 incl\. GST/)
  assert.match(page, /not a building inspection to AS 4349\.1/)
  assert.match(page, /Australian Consumer Law/)
})

test('the last-minute page is booked by phone or email only, with the company number', async () => {
  const page = await source(PAGE)
  assert.match(page, /CONTACT_PHONE_HREF/)
  assert.match(page, /mailto:\$\{CONTACT_EMAIL\}/)
  assert.doesNotMatch(page, /\/quote/, 'no quote form')
  assert.doesNotMatch(page, /from '@\/lib\/stripe|\/api\/checkout/, 'no online payment')
  assert.doesNotMatch(page, /OWNER_MOBILE|0416|Alan Hou/, 'no personal name or mobile')
  assert.match(page, /Melbourne’s south-east/)
})

test('the last-minute page is in the sitemap, the release gate and linked from the deadline callouts', async () => {
  assert.match(await source('app/sitemap.ts'), /'\/last-minute-building-inspection-melbourne'/)
  assert.match(await source('scripts/release-gate.mjs'), /'\/last-minute-building-inspection-melbourne'/)
  for (const path of ['app/building-and-pest-inspections/page.tsx', 'app/pre-purchase-building-inspection/page.tsx']) {
    assert.match(await source(path), /href="\/last-minute-building-inspection-melbourne"/, path)
  }
})
