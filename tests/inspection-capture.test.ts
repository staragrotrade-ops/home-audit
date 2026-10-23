import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('catalog: roof tiles, gutters and downpipes form one roofer lead; termites go to pest control', async () => {
  const { ELEMENTS, TRADES, elementOf, tradeFor } = await import('../lib/inspection-catalog.ts')
  for (const key of ['roof_tile', 'gutter', 'downpipe', 'ridge_capping', 'flashing']) {
    assert.equal(elementOf(key)?.trade, 'roofer', key)
  }
  assert.equal(tradeFor('subfloor_moisture', 'active_termites'), 'pest_controller')
  assert.equal(tradeFor('roof_tile', 'minor_defect', 'builder'), 'builder')
  assert.equal(tradeFor('roof_tile', 'minor_defect', 'not_a_trade'), 'roofer')
  assert.equal(elementOf('roof_tile')?.quantity?.unit, 'tiles')

  const trades = new Set(TRADES.map((trade) => trade.key))
  const keys = new Set<string>()
  for (const element of ELEMENTS) {
    assert.ok(trades.has(element.trade), `${element.key} uses an unknown trade`)
    assert.match(element.key, /^[a-z0-9_]{2,40}$/)
    assert.ok(!keys.has(element.key), `duplicate ${element.key}`)
    keys.add(element.key)
  }
})

test('defect sync: derives category, trade and unit; rejects broken pins and cause chains', async () => {
  const { defectInput, normaliseDefect, rootLinkProblem } = await import('../lib/inspection-sync.ts')
  const base = {
    id: '60000000-0000-4000-8000-000000000001',
    elementKey: 'roof_tile',
    severity: 'minor_defect',
    title: 'Cracked tiles',
    quantity: 4,
    clientUpdatedAt: '2026-10-20T01:00:00Z',
  }
  const parsed = defectInput.parse(base)
  const stored = normaliseDefect(parsed)
  assert.equal(stored.category, 'building')
  assert.equal(stored.tradeKey, 'roofer')
  assert.equal(stored.quantityUnit, 'tiles')

  assert.equal(normaliseDefect(defectInput.parse({ ...base, severity: 'termite_damage' })).category, 'timber_pest')
  assert.equal(defectInput.safeParse({ ...base, pinX: 0.5 }).success, false)
  assert.equal(defectInput.safeParse({ ...base, pinX: 0.5, pinY: 0.5 }).success, false)
  assert.equal(
    defectInput.safeParse({ ...base, pinX: 0.5, pinY: 0.5, floorplanId: '50000000-0000-4000-8000-000000000001' }).success,
    true,
  )
  assert.equal(defectInput.safeParse({ ...base, pinX: 1.2, pinY: 0.5, floorplanId: base.id }).success, false)
  assert.equal(defectInput.safeParse({ ...base, rootCauseId: base.id }).success, false)
  assert.equal(defectInput.safeParse({ ...base, tradeKey: 'astronaut' }).success, false)
  assert.equal(defectInput.safeParse({ ...base, clientUpdatedAt: '2099-01-01T00:00:00Z' }).success, false)

  const a = defectInput.parse({ ...base, id: '60000000-0000-4000-8000-00000000000a' })
  const b = defectInput.parse({ ...base, id: '60000000-0000-4000-8000-00000000000b', rootCauseId: a.id })
  const c = defectInput.parse({ ...base, id: '60000000-0000-4000-8000-00000000000c', rootCauseId: b.id })
  assert.equal(rootLinkProblem([a, b]), null)
  assert.match(rootLinkProblem([a, b, c]) || '', /itself linked/)
})

test('floorplan finder: picks plans, ignores ordinary photos, https only', async () => {
  const { findFloorplanImageUrls, sniffImageType, imageSize } = await import('../lib/floorplan.ts')
  const html = `
    <img src="https://cdn.example.com/photos/kitchen.jpg" alt="Kitchen">
    <img src="/media/plan-ground.png" alt="Floor plan">
    <script>{"floorplans":[{"url":"https:\\/\\/i2.cdn.example.com\\/abc\\/main.webp"}]}</script>
    <a href="https://cdn.example.com/listing/123/floorplan_1.jpg?w=800">plan</a>
    <img src="http://insecure.example.com/floorplan.jpg">
  `
  const urls = findFloorplanImageUrls(html, 'https://agency.example.com/listing/1')
  assert.equal(urls[0], 'https://cdn.example.com/listing/123/floorplan_1.jpg?w=800')
  assert.ok(urls.includes('https://i2.cdn.example.com/abc/main.webp'))
  assert.ok(urls.includes('https://agency.example.com/media/plan-ground.png'))
  assert.ok(!urls.some((url) => url.includes('kitchen')))
  assert.ok(!urls.some((url) => url.startsWith('http:')))

  const png = new Uint8Array(24)
  png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  new DataView(png.buffer).setUint32(16, 1200)
  new DataView(png.buffer).setUint32(20, 800)
  assert.equal(sniffImageType(png), 'image/png')
  assert.deepEqual(imageSize(png, 'image/png'), { width: 1200, height: 800 })
  assert.equal(sniffImageType(new TextEncoder().encode('<html>')), null)
})

test('floorplan fetch: public https hosts only, no IP literals, capped and recorded', async () => {
  const { assertPublicHttpsUrl } = await import('../lib/floorplan.ts')
  await assert.rejects(assertPublicHttpsUrl('http://example.com/a'), /https/)
  await assert.rejects(assertPublicHttpsUrl('https://127.0.0.1/a'), /IP address/)
  await assert.rejects(assertPublicHttpsUrl('https://[::1]/a'), /IP address/)
  await assert.rejects(assertPublicHttpsUrl('https://user:pw@example.com/a'), /credentials/)
  await assert.rejects(assertPublicHttpsUrl('https://example.com:8443/a'), /port/)

  const lib = await source('lib/floorplan.ts')
  assert.match(lib, /redirect: 'manual'/)
  assert.match(lib, /AbortSignal\.timeout/)
  assert.match(lib, /floorplan_fetch_status/)

  const webhook = await source('app/api/stripe/webhook/route.ts')
  assert.match(webhook, /after\(async/)
  assert.match(webhook, /!job\.floorplan_fetch_status/)
})

test('capture migration: RLS on every table, writes only via service_role functions', async () => {
  const sql = await source('supabase/migrations/20261021100000_inspection_capture.sql')
  for (const table of ['job_floorplans', 'inspection_defects', 'inspection_photos', 'defect_templates']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`))
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from anon, authenticated`))
  }
  for (const fn of ['app_sync_defects', 'app_register_photo', 'app_submit_fieldwork']) {
    assert.match(sql, new RegExp(`revoke all on function public\\.${fn}\\([^)]*\\) from public, anon, authenticated`))
    assert.match(sql, new RegExp(`grant execute on function public\\.${fn}\\([^)]*\\) to service_role`))
  }
  assert.match(sql, /cannot issue reports/)
  assert.match(sql, /photo\(s\) are still uploading/)
  assert.match(sql, /grant select on table public\.trade_job_leads to service_role/)
  assert.doesNotMatch(sql, /grant select on table public\.trade_job_leads to authenticated/)
  // Storage paths of photos and floorplans are never readable by the app.
  assert.doesNotMatch(sql.match(/grant select \([^)]*\) on public\.job_floorplans/)?.[0] || '', /storage_path/)
  assert.doesNotMatch(sql.match(/grant select \([^)]*\) on public\.inspection_photos/)?.[0] || '', /storage_path/)
})

test('app routes: every capture route authenticates the inspector', async () => {
  const routes = [
    'app/api/app/catalog/route.ts',
    'app/api/app/jobs/[id]/inspection/route.ts',
    'app/api/app/jobs/[id]/defects/route.ts',
    'app/api/app/jobs/[id]/photos/route.ts',
    'app/api/app/jobs/[id]/photos/[photoId]/route.ts',
    'app/api/app/jobs/[id]/floorplans/upload/route.ts',
    'app/api/app/jobs/[id]/floorplans/complete/route.ts',
    'app/api/app/jobs/[id]/submit/route.ts',
  ]
  for (const route of routes) {
    assert.match(await source(route), /authenticateInspector\(request\)/, route)
  }
  const config = await source('app/api/app/config/route.ts')
  assert.match(config, /sb_secret/)
  assert.doesNotMatch(config, /SUPABASE_SECRET_KEY/)

  const customer = await source('app/api/order/[token]/floorplan/route.ts')
  assert.match(customer, /isSameOriginMutation\(request\)/)
  assert.match(customer, /consume_rate_limit/)
  assert.match(customer, /payment_status !== 'paid'/)
})

test('catalog: landscaper takes retaining walls and vegetation; fencer keeps fences', async () => {
  const { elementOf, isTradeKey } = await import('../lib/inspection-catalog.ts')
  assert.ok(isTradeKey('landscaper'))
  assert.equal(elementOf('retaining_wall')?.trade, 'landscaper')
  assert.equal(elementOf('vegetation')?.trade, 'landscaper')
  assert.equal(elementOf('fence')?.trade, 'fencer')
})

test('dictation: prompt forbids invented findings; reply is validated; nothing stored', async () => {
  const { dictationPrompt, parseDictationReply, dictationMimeType } = await import('../lib/dictation.ts')
  const prompt = dictationPrompt({ field: 'observation', element: 'Gutters', existing: 'Old text' })
  assert.match(prompt, /Never add a defect/)
  assert.match(prompt, /Mandarin Chinese/)
  assert.match(prompt, /Gutters/)
  assert.match(prompt, /do not repeat it/)

  const parsed = parseDictationReply('```json\n{"transcript":"水槽堵了","language":"zh","text":"Gutters are blocked.","notes":"","extra":1}\n```')
  assert.deepEqual(parsed, { transcript: '水槽堵了', language: 'zh', text: 'Gutters are blocked.', notes: '' })
  assert.equal(parseDictationReply('{"transcript":"x","language":"klingon","text":"y","notes":""}').language, 'en')
  assert.throws(() => parseDictationReply('not json'), /could not be read/)
  assert.throws(() => parseDictationReply('{"transcript":"","text":""}'), /No speech/)
  assert.equal(dictationMimeType('audio/x-wav'), 'audio/wav')

  const route = await source('app/api/app/dictation/route.ts')
  assert.match(route, /authenticateInspector\(request\)/)
  assert.match(route, /consume_rate_limit/)
  assert.doesNotMatch(route, /storage\.from/)
})

test('areas: validated, never blocked by a missing reason; route authenticates; RLS on', async () => {
  const { areaInput } = await import('../lib/inspection-sync.ts')
  const base = { id: '80000000-0000-4000-8000-000000000001', name: 'Roof space', kind: 'roof_space', clientUpdatedAt: '2026-10-22T01:00:00Z' }
  assert.equal(areaInput.safeParse({ ...base, status: 'inspected' }).success, true)
  assert.equal(areaInput.safeParse({ ...base, status: 'limited' }).success, true)
  assert.equal(areaInput.safeParse({ ...base, status: 'not_accessible', limitation: 'No access hatch found' }).success, true)
  assert.equal(areaInput.safeParse({ ...base, status: 'bogus' }).success, false)

  assert.match(await source('app/api/app/jobs/[id]/areas/route.ts'), /authenticateInspector\(request\)/)
  const sql = await source('supabase/migrations/20261023100000_inspection_areas.sql')
  assert.match(sql, /alter table public\.inspection_areas enable row level security/)
  assert.match(sql, /revoke all on function public\.app_sync_areas\(uuid, uuid, jsonb\) from public, anon, authenticated/)
  assert.match(sql, /Sync the area before its photos/)
})

test('defects: extra floorplan locations are optional, capped and need a first location', async () => {
  const { defectInput, normaliseDefect, EXTRA_PINS_MAX } = await import('../lib/inspection-sync.ts')
  const plan = '50000000-0000-4000-8000-000000000001'
  const base = {
    id: '60000000-0000-4000-8000-000000000001',
    elementKey: 'ceiling',
    severity: 'minor_defect',
    title: 'Cracking',
    clientUpdatedAt: '2026-10-22T01:00:00Z',
  }
  assert.deepEqual(normaliseDefect(defectInput.parse(base)).extraPins, [])
  const pinned = { ...base, floorplanId: plan, pinX: 0.1, pinY: 0.1 }
  const two = defectInput.parse({ ...pinned, extraPins: [{ floorplanId: plan, x: 0.5, y: 0.5 }, { floorplanId: plan, x: 0.9, y: 0.2 }] })
  assert.equal(normaliseDefect(two).extraPins.length, 2)
  assert.equal(defectInput.safeParse({ ...base, extraPins: [{ floorplanId: plan, x: 0.5, y: 0.5 }] }).success, false)
  assert.equal(defectInput.safeParse({ ...pinned, extraPins: [{ floorplanId: plan, x: 1.5, y: 0.5 }] }).success, false)
  const many = Array.from({ length: EXTRA_PINS_MAX + 1 }, () => ({ floorplanId: plan, x: 0.5, y: 0.5 }))
  assert.equal(defectInput.safeParse({ ...pinned, extraPins: many }).success, false)

  const sql = await source('supabase/migrations/20261023110000_defect_extra_pins.sql')
  assert.match(sql, /extra_pins_valid\(p_job_id, v_extra\)/)
  assert.match(sql, /revoke all on function public\.app_sync_defects\(uuid, uuid, jsonb\) from public, anon, authenticated/)
})

test('sort order: phones send creation time in seconds; it must be accepted', async () => {
  const { defectInput, areaInput, photoInput } = await import('../lib/inspection-sync.ts')
  const sortOrder = Math.floor(Date.parse('2026-10-22T10:00:00Z') / 1000)
  assert.equal(
    defectInput.safeParse({
      id: '60000000-0000-4000-8000-000000000001',
      elementKey: 'gutter',
      severity: 'minor_defect',
      title: 'Blocked gutter',
      sortOrder,
      clientUpdatedAt: '2026-10-22T10:00:00.000Z',
    }).success,
    true,
  )
  assert.equal(areaInput.safeParse({ id: '80000000-0000-4000-8000-000000000001', name: 'Kitchen', sortOrder, clientUpdatedAt: '2026-10-22T10:00:00Z' }).success, true)
  assert.equal(
    photoInput.safeParse({ id: '70000000-0000-4000-8000-000000000001', sizeBytes: 10, sha256: 'a'.repeat(64), capturedAt: '2026-10-22T10:00:00Z', sortOrder }).success,
    true,
  )
})

test('report terms: agree with the Inspection Agreement and Australian law', async () => {
  const { reportTermsPayload, REPORT_TERMS_SECTIONS, REPORT_SCOPE_SECTIONS } = await import('../lib/report-terms.ts')
  const payload = reportTermsPayload()
  const all = JSON.stringify(payload)
  // Placeholders are filled; no unfilled {tokens} reach the report.
  assert.doesNotMatch(all, /\{(company|acn|phone|email)\}/)
  assert.match(all, /GXH Consultancy Pty Ltd/)
  // ACL rights preserved; no arbitration or indemnity clauses; complaints to CAV / VCAT.
  assert.match(all, /Australian Consumer Law/)
  assert.match(all, /VCAT/)
  assert.doesNotMatch(all, /[Aa]rbitrat|indemnif/)
  assert.doesNotMatch(all, /Institute of Arbitrators/)
  // Standards and AS 4349.1 Appendix C ratings are defined.
  for (const term of ['AS 4349.1-2007', 'AS 4349.3-2010', 'AS 3660.2', 'AS 2870', 'Above average', 'Typical']) {
    assert.ok(all.includes(term), term)
  }
  // A building-only report must not get pest-only blocks; scopes are valid.
  for (const section of [...REPORT_SCOPE_SECTIONS, ...REPORT_TERMS_SECTIONS]) {
    assert.ok(['all', 'building', 'pest'].includes(section.scope))
    for (const block of section.blocks) assert.ok(!block.scope || ['all', 'building', 'pest'].includes(block.scope))
  }
  assert.equal(REPORT_TERMS_SECTIONS.find((s) => s.id === 'timber-pests')?.scope, 'pest')
})

test('assessment: ratings validated; route authenticates; catalog serves the terms', async () => {
  const { assessmentInput } = await import('../lib/inspection-sync.ts')
  const ok = { buildingCondition: 'average', majorIncidence: 'low', pestRisk: 'moderate', pestIntervalMonths: 6, furtherInspections: ['electrician'], clientUpdatedAt: '2026-10-22T05:00:00Z' }
  assert.equal(assessmentInput.safeParse(ok).success, true)
  assert.equal(assessmentInput.safeParse({ ...ok, buildingCondition: 'great' }).success, false)
  assert.equal(assessmentInput.safeParse({ ...ok, pestIntervalMonths: 36 }).success, false)
  assert.equal(assessmentInput.safeParse({ ...ok, furtherInspections: ['astrologer'] }).success, false)
  assert.match(await source('app/api/app/jobs/[id]/assessment/route.ts'), /authenticateInspector\(request\)/)
  assert.match(await source('app/api/app/catalog/route.ts'), /reportTerms: reportTermsPayload\(\)/)
  const sql = await source('supabase/migrations/20261024100000_inspection_assessment.sql')
  assert.match(sql, /alter table public\.inspection_assessments enable row level security/)
  assert.match(sql, /revoke all on function public\.app_save_assessment\(uuid, uuid, jsonb\) from public, anon, authenticated/)
})
