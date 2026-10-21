import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('the phone menu closes on link tap, page change, outside tap, scroll and Escape', async () => {
  const menu = await source('components/mobile-menu.tsx')
  assert.match(menu, /onClick=\{close\}/)
  assert.match(menu, /\[pathname\]/)
  assert.match(menu, /'pointerdown'/)
  assert.match(menu, /'scroll'/)
  assert.match(menu, /'Escape'/)
  const header = await source('components/site-header.tsx')
  assert.match(header, /<MobileMenu \/>/)
  assert.doesNotMatch(header, /<details/)
})
