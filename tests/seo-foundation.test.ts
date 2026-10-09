import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('sitemap contains launch content and excludes the transactional quote route', async () => {
  const sitemap = await source('app/sitemap.ts')
  const guides = await source('lib/guides.ts')

  assert.match(sitemap, /pre-purchase-building-inspection/)
  assert.match(sitemap, /practical-completion-inspection/)
  assert.match(sitemap, /credentials/)
  assert.match(sitemap, /['"]\/guides['"]/)
  assert.match(sitemap, /GUIDES\.map/)
  assert.match(guides, /building-inspection-buyers-market/)
  assert.match(guides, /agent-pressure-skip-building-inspection/)
  assert.doesNotMatch(sitemap, /['"]\/quote['"]/)
})

test('quote route remains available but is not indexable', async () => {
  const quote = await source('app/quote/page.tsx')

  assert.match(quote, /index:\s*false/)
})

test('professional credential is visible on a public page and present in structured data', async () => {
  const site = await source('lib/site.ts')
  const credentials = await source('app/credentials/page.tsx')
  const layout = await source('app/layout.tsx')

  assert.match(site, /Xiaoqiong Yang/)
  assert.match(site, /IN-L 100094/)
  assert.match(credentials, /Professional indemnity insurance maintained/)
  assert.match(layout, /EducationalOccupationalCredential/)
})

test('preview hosts emit a noindex response header', async () => {
  const proxy = await source('proxy.ts')

  assert.match(proxy, /\.vercel\.app/)
  assert.match(proxy, /X-Robots-Tag/)
  assert.match(proxy, /noindex, nofollow/)
})

test('the first editorial guide is connected to search and conversion paths', async () => {
  const article = await source(
    'app/guides/building-inspection-buyers-market/page.tsx',
  )
  const homepage = await source('app/page.tsx')
  const prePurchase = await source('app/pre-purchase-building-inspection/page.tsx')

  assert.match(article, /'@type': 'Article'/)
  assert.match(article, /'@type': 'BreadcrumbList'/)
  assert.match(article, /'@type': 'FAQPage'/)
  assert.match(article, /Xiaoqiong Yang/)
  assert.match(article, /29 September 2026/)
  assert.match(article, /Australian Bureau of Statistics/)
  assert.match(homepage, /FEATURED_GUIDE\.path/)
  assert.match(prePurchase, /guides\/building-inspection-buyers-market/)
})

test('the buyer-market guide includes a privacy-safe real case study', async () => {
  const article = await source(
    'app/guides/building-inspection-buyers-market/page.tsx',
  )

  assert.match(article, /Real buyer case · Carrum Downs/)
  assert.match(article, /This Carrum Downs case/)
  assert.match(article, /obtained a discount from the vendor/)
  assert.match(article, /moved in\s+30 days later/)
  assert.match(article, /One real outcome, not a promise/)
  assert.match(article, /case-study-roof-report-excerpt\.webp/)
  assert.match(article, /case-study-moisture-report-excerpt\.webp/)

  await access(
    new URL('../public/case-study-roof-report-excerpt.webp', import.meta.url),
  )
  await access(
    new URL('../public/case-study-moisture-report-excerpt.webp', import.meta.url),
  )
})

test('the agent-pressure guide gives balanced, sourced buyer protections', async () => {
  const article = await source(
    'app/guides/agent-pressure-skip-building-inspection/page.tsx',
  )
  const homepage = await source('app/page.tsx')
  const prePurchase = await source('app/pre-purchase-building-inspection/page.tsx')

  assert.match(article, /'@type': 'Article'/)
  assert.match(article, /'@type': 'BreadcrumbList'/)
  assert.match(article, /'@type': 'FAQPage'/)
  assert.match(article, /The selling agent is doing a job—but it is not your job/)
  assert.match(article, /There is another unconditional offer/)
  assert.match(article, /Someone has already inspected it/)
  assert.match(article, /Use our inspector/)
  assert.match(article, /Case note · Dromana, Victoria · Details anonymised/)
  assert.match(article, /scope, <strong>independence<\/strong>/)
  assert.match(article, /regular referrals from\s+an agent/)
  assert.match(article, /another buyer&apos;s\s+inspector/)
  assert.match(article, /Report source A/)
  assert.match(article, /Report source B/)
  assert.match(article, /Real buyer case · Dromana, Victoria/)
  assert.match(article, /Two possible sources of an existing report/)
  assert.doesNotMatch(article, />Origin A</)
  assert.doesNotMatch(article, />Origin B</)
  assert.match(article, /financial loss reached about A\$70,000/)
  assert.match(article, /child had\s+to change schools/)
  assert.match(article, /move out, pay for temporary rental accommodation/)
  assert.match(
    article,
    /Please liaise with my\s+inspector to book a building and pest inspection/,
  )
  assert.doesNotMatch(article, /Thank you for the existing report/)
  assert.doesNotMatch(article, /send the available\s+access times/)
  assert.match(article, /does\s+not allege misconduct/)
  assert.match(article, /Consumer Affairs Victoria/)
  assert.match(article, /Public posts illustrate pressure\s+patterns/)
  assert.match(homepage, /FEATURED_GUIDE\.homepageHighlights/)
  assert.match(prePurchase, /agent-pressure-skip-building-inspection/)
})

test('editorial doctrine requires a suburb in every published case', async () => {
  const principles = await source('docs/DEVELOPMENT_PRINCIPLES_AND_ROADMAP.md')

  assert.match(principles, /Every published case\s+must state its suburb/)
  assert.match(principles, /The suburb name is mandatory/)
  assert.match(principles, /street number, street name, client\s+name/)
})

test('sample admin pipeline is gated and a contact email is published', async () => {
  const admin = await source('app/admin/page.tsx')
  const site = await source('lib/site.ts')
  const footer = await source('components/site-footer.tsx')

  assert.match(admin, /ADMIN_PREVIEW_ENABLED/)
  assert.match(admin, /notFound\(\)/)
  assert.match(site, /CONTACT_EMAIL = 'info@homeaudit\.com\.au'/)
  assert.match(footer, /mailto:/)
})

test('page metadata keeps the Googlebot preview directives', async () => {
  const metadata = await source('lib/metadata.ts')

  assert.match(metadata, /googleBot/)
  assert.match(metadata, /max-image-preview/)
})

test('the new-home stage guide is attributed correctly and linked into the cluster', async () => {
  const article = await source(
    'app/guides/independent-new-home-stage-inspections/page.tsx',
  )
  const guides = await source('lib/guides.ts')
  const newHome = await source('app/new-home-inspections/page.tsx')
  const pci = await source('app/practical-completion-inspection/page.tsx')

  assert.match(guides, /independent-new-home-stage-inspections/)
  assert.match(article, /'@type': 'Article'/)
  assert.match(article, /'@type': 'BreadcrumbList'/)
  assert.match(article, /By Xiaoqiong Yang/)
  assert.doesNotMatch(article, /Alan/)
  assert.match(article, /A member of the Home Audit team previously worked/)
  assert.match(article, /Do not automatically refuse payment/)
  assert.match(article, /Consumer Affairs Victoria/)
  assert.ok((article.match(/href="\/new-home-inspections"/g) || []).length >= 3)
  assert.match(newHome, /guides\/independent-new-home-stage-inspections/)
  assert.match(pci, /guides\/independent-new-home-stage-inspections/)
})

test('the defect-clause guide keeps its attribution, sources and legal boundaries', async () => {
  const article = await source(
    'app/guides/major-building-defect-vs-major-structural-defect-victoria/page.tsx',
  )
  const guides = await source('lib/guides.ts')
  const agentGuide = await source(
    'app/guides/agent-pressure-skip-building-inspection/page.tsx',
  )
  const prePurchase = await source('app/pre-purchase-building-inspection/page.tsx')
  const buildingAndPest = await source('app/building-and-pest-inspections/page.tsx')
  const slug = /guides\/major-building-defect-vs-major-structural-defect-victoria/

  assert.match(guides, slug)
  assert.match(article, /'@type': 'Article'/)
  assert.match(article, /'@type': 'BreadcrumbList'/)
  assert.match(article, /By Xiaoqiong Yang/)
  assert.doesNotMatch(article, /Alan/)
  assert.doesNotMatch(article, /Reviewed by/)
  assert.match(article, /A member of the Home Audit team previously worked/)
  assert.match(article, /more than ten new-home\s+inspections/)
  assert.match(article, /Willis v Crosland/)
  assert.match(article, /It is not legal\s+advice/)
  assert.match(article, /does not\s+prove the property has a problem/)
  // The example contract identifies a property and parties, so it is never linked.
  assert.doesNotMatch(article, /amazonaws\.com/)
  assert.doesNotMatch(article, /href="\/new-home-inspections"/)
  assert.match(article, /quote\?service=building-and-pest/)
  assert.match(agentGuide, slug)
  assert.match(prePurchase, slug)
  assert.match(buildingAndPest, slug)
})

test('the pre-slab case study keeps its attribution, hedging and links', async () => {
  const article = await source('app/guides/pre-slab-inspection-glen-waverley/page.tsx')
  const guides = await source('lib/guides.ts')
  const newHome = await source('app/new-home-inspections/page.tsx')
  const stageGuide = await source(
    'app/guides/independent-new-home-stage-inspections/page.tsx',
  )
  const slug = /guides\/pre-slab-inspection-glen-waverley/

  assert.match(guides, slug)
  assert.match(article, /'@type': 'Article'/)
  assert.match(article, /'@type': 'BreadcrumbList'/)
  assert.match(article, /By <Link href="\/credentials">Xiaoqiong Yang<\/Link>/)
  assert.doesNotMatch(article, /Alan/)
  assert.doesNotMatch(article, /Reviewed by/)
  // The site experiences described are not the author's own, so the article
  // must not narrate them in the first person.
  assert.doesNotMatch(article, /\bI (raised|produced|saw|worked|was expected)\b/)
  assert.match(article, /A member of the Home Audit team previously worked/)
  assert.match(article, /That does not mean it will fail/)
  assert.match(article, /not Victorian law/)
  assert.match(article, /quote\?service=new-home/)
  assert.match(newHome, slug)
  assert.match(stageGuide, slug)
})

test('the builder-friend guide stays brand-neutral and links both ways', async () => {
  const article = await source(
    'app/guides/builder-friend-vs-building-inspector/page.tsx',
  )
  const guides = await source('lib/guides.ts')
  const newHome = await source('app/new-home-inspections/page.tsx')
  const slug = /guides\/builder-friend-vs-building-inspector/

  assert.match(guides, slug)
  assert.match(article, /'@type': 'Article'/)
  assert.match(article, /'@type': 'BreadcrumbList'/)
  assert.doesNotMatch(article, /Sherridon/i)
  assert.doesNotMatch(article, /Alan/)
  assert.match(article, /By <Link href="\/about">Home Audit Inspector<\/Link>/)
  assert.doesNotMatch(article, /Xiaoqiong/)
  assert.match(article, /A report does not win a dispute for you/)
  assert.match(article, /does not mean the builder stops being responsible/)
  assert.match(article, /cannot find\s+every hidden or future defect/)
  assert.match(article, /href="\/new-home-inspections"/)
  assert.match(newHome, slug)
})

test('Vercel Web Analytics loads from this origin on production only', async () => {
  const analytics = await source('components/analytics.tsx')

  assert.match(analytics, /src="\/_vercel\/insights\/script\.js"/)
  assert.match(analytics, /process\.env\.VERCEL_ENV === 'production'/)
  assert.match(analytics, /isVercelProduction \? <VercelWebAnalytics \/> : null/)
})
