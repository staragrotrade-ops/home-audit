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
  assert.match(page, /href: '\/zh\/inspection'/)
  assert.match(page, /href: '\/zh\/consulting'/)
  assert.match(await source('lib/site.ts'), /ZH_BRAND_NAME = '归处'/)
  const home = await source('app/page.tsx')
  assert.match(home, /languages: HOME_LANGUAGES/)
  assert.match(await source('lib/site.ts'), /'zh-Hans': '\/zh'/)
})

test('归处: two business lines today; maintenance and the partner network are not shown', async () => {
  const pages = ['app/zh/page.tsx', 'app/zh/inspection/page.tsx', 'app/zh/consulting/page.tsx', 'app/zh/about/page.tsx']
  for (const path of pages) {
    const page = await source(path)
    assert.match(page, /lang="zh-Hans"/, path)
    assert.match(page, /locale: 'zh_CN'/, path)
    assert.doesNotMatch(page, /\$\s?\d|formatAud/, `${path}: no prices`)
    assert.doesNotMatch(page, /房屋维护|合作伙伴网络|加盟|全生命周期|即将推出/, `${path}: only services offered today`)
    assert.doesNotMatch(page, /Alan|0416/, path)
  }
  const inspection = await source('app/zh/inspection/page.tsx')
  for (const service of ['购房前验房', '新房阶段检查', '137B', '房屋状况评估', 'Dilapidation']) {
    assert.ok(inspection.includes(service), service)
  }
  assert.match(inspection, /href: '\/zh\/quote\?service=building-and-pest'/)
  // Owner wording, 30 October 2026.
  assert.match(inspection, /AS 4349\.1/)
  assert.match(inspection, /不能单凭一条裂缝就认定地基有问题/)
  assert.match(inspection, /检查范围和检查深度都由卖方决定/)
  assert.match(await source('app/zh/page.tsx'), /每个缺陷都配照片/)
  assert.match(await source('app/zh/about/page.tsx'), /\['清晰', /)
  assert.match(await source('app/zh/quote/page.tsx'), /您买的不是一件商品，而是专业知识和保障/)
  const consulting = await source('app/zh/consulting/page.tsx')
  for (const service of ['建筑缺陷调查', '技术评估', '建筑纠纷专家报告', '专家证人']) {
    assert.ok(consulting.includes(service), service)
  }
  assert.doesNotMatch(consulting, /技术鉴定|保证|胜诉|打赢/)
  assert.match(consulting, /专家首先对审理机构负责/)
  assert.match(consulting, /Class 1/)
  assert.match(consulting, /我们不提供法律意见/)
  assert.match(consulting, /quote=\{false\}/)
  const sitemap = await source('app/sitemap.ts')
  const gate = await source('scripts/release-gate.mjs')
  for (const route of ['/zh/inspection', '/zh/consulting', '/zh/about']) {
    assert.ok(sitemap.includes(`'${route}'`), route)
    assert.ok(gate.includes(`'${route}'`), route)
  }
  const site = await source('lib/site.ts')
  assert.match(site, /href: '\/zh\/inspection', label: '房屋检查'/)
  assert.match(site, /href: '\/zh\/consulting', label: '建筑技术咨询'/)
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
  const header = await source('components/site-header.tsx')
  assert.match(header, /\{zh \? 'English' : '中文'\}/)
  // The Chinese name goes with the company name, not in the service line.
  assert.match(header, /`\$\{ZH_BRAND_NAME\} Home Audit`/)
  assert.match(header, /ZH_TAGLINE/)
  assert.match(await source('lib/site.ts'), /ZH_TAGLINE = '房屋检查 · 建筑技术咨询'/)
  assert.match(await source('app/sitemap.ts'), /'\/zh',/)
  assert.match(await source('scripts/release-gate.mjs'), /'\/zh',/)
})
