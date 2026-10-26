import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('stamping: names printed into the template slots, Latin-1 only, new buyer only', async () => {
  const { PDFDocument } = await import('pdf-lib')
  const { stampReport, pdfSafe, slotText, nameSlots } = await import('../lib/report-stamp.ts')
  assert.equal(pdfSafe('  Zoë “Smith”  '), 'Zoë "Smith"')
  assert.equal(pdfSafe('王小明'), '???')
  const slots = nameSlots.parse([
    { kind: 'cover_client', page: 1, x: 150, y: 400, w: 200, h: 15.6, size: 12, color: 0xff000000 },
    { kind: 'header', page: 2, x: 295, y: 790, w: 260, h: 10.4, size: 8, align: 'right', color: 0xff5e6b69 },
    { kind: 'note', page: 1, x: 40, y: 700, w: 515, h: 11.7, size: 9, color: 0xffd6bf8c },
  ])
  assert.equal(slotText(slots[1], { clientName: 'Bea Second' }), 'Prepared for Bea Second')
  assert.equal(slotText(slots[2], { clientName: 'Bea Second' }), '')
  const template = await PDFDocument.create()
  template.addPage([595, 842])
  template.addPage([595, 842])
  const stamped = await stampReport(await template.save(), slots, { clientName: 'Bea Second', note: 'Report transferred to Bea Second.' })
  const reloaded = await PDFDocument.load(stamped)
  assert.equal(reloaded.getPageCount(), 2)
  assert.ok(stamped.length > 500)
  // Bad slots are refused before printing.
  assert.throws(() => nameSlots.parse([{ kind: 'other', page: 1, x: 0, y: 0, w: 1, h: 1, size: 1 }]))
})

test('download code: signed browser access, per job, expires', async () => {
  process.env.ADMIN_SESSION_SECRET = 'test-secret-for-download-codes-0123456789'
  const { grantAccess, hasAccess, maskEmail, codeHash, newDownloadCode } = await import('../lib/report-download.ts')
  const now = Date.parse('2026-10-27T00:00:00Z')
  const cookie = grantAccess(undefined, 'job-a', now)
  assert.equal(hasAccess(cookie, 'job-a', now + 1000), true)
  assert.equal(hasAccess(cookie, 'job-b', now + 1000), false)
  assert.equal(hasAccess(cookie, 'job-a', now + 13 * 3_600_000), false)
  assert.equal(hasAccess(cookie.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')), 'job-a', now), false)
  const both = grantAccess(cookie, 'job-b', now)
  assert.equal(hasAccess(both, 'job-a', now) && hasAccess(both, 'job-b', now), true)
  assert.equal(maskEmail('alex@example.com'), 'al••@example.com')
  assert.match(newDownloadCode(), /^\d{6}$/)
  assert.notEqual(codeHash('job-a', '123456'), codeHash('job-b', '123456'))
})

test('download routes: code to the order email only, attempts limited, report needs the cookie', async () => {
  const send = await source('app/api/order/[token]/report-code/route.ts')
  assert.match(send, /job\.customer_snapshot\?\.email/)
  assert.match(send, /consume_rate_limit/)
  assert.doesNotMatch(send, /readJsonBody/)
  const verify = await source('app/api/order/[token]/report-verify/route.ts')
  assert.match(verify, /httpOnly: true/)
  assert.match(verify, /checkDownloadCode/)
  const lib = await source('lib/report-download.ts')
  assert.match(lib, /CODE_ATTEMPTS = 5/)
  assert.match(lib, /timingSafeEqual/)
  const report = await source('app/api/order/[token]/report/route.ts')
  assert.match(report, /hasAccess\(/)
})

test('transfer: 30-day window, $275 incl. GST, own order and agreement, no names on the public page', async () => {
  const sql = await source('supabase/migrations/20261029100000_report_transfer.sql')
  assert.match(sql, /interval '30 days'/)
  assert.match(sql, /price_cents integer not null default 27500/)
  assert.match(sql, /'report_transfer'/)
  assert.match(sql, /and j\.intake_channel <> 'report_transfer'/)
  assert.match(sql, /grant execute on function public\.create_transfer_job\(text, jsonb\) to service_role/)
  assert.match(sql, /revoke all on table public\.report_download_codes from anon, authenticated/)
  const page = await source('app/r/[code]/page.tsx')
  assert.doesNotMatch(page, /customer_snapshot|client_name|storage_path/)
  const lib = await source('lib/report-transfer.ts')
  assert.match(lib, /TRANSFER_PRICE_CENTS = 27500/)
  assert.match(lib, /clientName: name/)
  assert.match(lib, /transferNote\(/)
  const orders = await source('lib/orders.ts')
  assert.match(orders, /intake_channel === 'report_transfer'/)
  assert.match(orders, /completeTransfer\(supabase, jobId\)/)
  const complete = await source('app/api/app/jobs/[id]/report-complete/route.ts')
  assert.match(complete, /stampReport\(/)
  assert.match(complete, /template_path: input\.storagePath/)
})
