import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { QUOTE_COPY, translateServerMessage } from '../lib/quote-copy.ts'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('归处: the Chinese home page keeps the slogan, links its English page and shows no prices', async () => {
  const page = await source('app/zh/page.tsx')
  assert.match(page, /历经远行，终有归处。/)
  assert.match(page, /ZH_BRAND_NAME/)
  assert.match(page, /languages: HOME_LANGUAGES/)
  assert.match(page, /lang="zh-Hans"/)
  assert.doesNotMatch(page, /\$\s?\d|formatAud|PRICE/, 'no prices (owner decision)')
  assert.doesNotMatch(page, /长期照料/, 'no promise of ongoing care')
  assert.doesNotMatch(page, /Alan|0416/)
  assert.match(page, /href: '\/zh\/quote\?service=building-and-pest'/)
  assert.match(await source('lib/site.ts'), /ZH_BRAND_NAME = '归处'/)
  const home = await source('app/page.tsx')
  assert.match(home, /languages: HOME_LANGUAGES/)
  assert.match(await source('lib/site.ts'), /'zh-Hans': '\/zh'/)
})

test('the Chinese quote page uses the same form in Chinese and is not indexed', async () => {
  const page = await source('app/zh/quote/page.tsx')
  assert.match(page, /<QuoteFlow\s+lang="zh"/)
  assert.match(page, /index: false/)
  const form = await source('components/quote-flow.tsx')
  assert.match(form, /const t = QUOTE_COPY\[lang\]/)
  assert.match(form, /form_language: lang/)
  const route = await source('app/api/quote/route.ts')
  assert.match(route, /formLanguage === 'zh'/)
  assert.match(await source('lib/quote-schema.ts'), /form_language: z\.enum\(\['en', 'zh'\]\)/)
})

test('the Chinese copy covers every English key and translates server messages', () => {
  const en = QUOTE_COPY.en
  const zh = QUOTE_COPY.zh
  for (const group of ['fields', 'errors', 'stages', 'existingTypes', 'priceBands', 'propertyTypes', 'storeyOptions', 'sources'] as const) {
    assert.deepEqual(Object.keys(zh[group]).sort(), Object.keys(en[group]).sort(), group)
  }
  assert.equal(zh.steps.length, en.steps.length)
  assert.equal(translateServerMessage(zh, 'Too many requests. Please try again later.'), '提交次数太多，请稍后再试。')
  assert.equal(translateServerMessage(zh, 'Something new'), 'Something new')
  assert.equal(translateServerMessage(en, 'Invalid request.'), 'Invalid request.')
})

test('header, phone menu and footer switch to Chinese under /zh', async () => {
  const site = await source('lib/site.ts')
  assert.match(site, /export function isZhPath/)
  for (const path of ['components/site-header.tsx', 'components/mobile-menu.tsx', 'components/site-footer.tsx']) {
    const file = await source(path)
    assert.match(file, /isZhPath\(/, path)
  }
  assert.match(await source('components/site-header.tsx'), /\{zh \? 'English' : '中文'\}/)
  assert.match(await source('app/sitemap.ts'), /'\/zh',/)
  assert.match(await source('scripts/release-gate.mjs'), /'\/zh',/)
})
