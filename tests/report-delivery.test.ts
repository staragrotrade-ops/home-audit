import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('issuing a report no longer marks the job "Report sent"; sending does', async () => {
  const sql = await source('supabase/migrations/20261028100000_report_delivery.sql')
  const issue = sql.slice(sql.indexOf('create or replace function public.register_inspection_report'), sql.indexOf('-- Correct jobs'))
  assert.match(issue, /then 'inspected' else status end/)
  assert.doesNotMatch(issue, /report_sent/)
  const send = sql.slice(sql.indexOf('create or replace function public.mark_report_sent'))
  assert.match(send, /'report_sent'/)
  assert.match(send, /status <> 'issued'/)
  // Existing jobs wrongly marked are corrected; re-runnable; service role only.
  assert.match(sql, /update public\.jobs j set status = 'inspected'/)
  assert.match(sql, /add column if not exists sent_at/)
  for (const fn of ['mark_report_sent(uuid, text, uuid)', 'app_report_sender(uuid, uuid)', 'record_report_download(uuid)']) {
    assert.ok(sql.includes(`grant execute on function public.${fn} to service_role`), fn)
    assert.ok(sql.includes(`revoke all on function public.${fn} from public, anon, authenticated`), fn)
  }
})

test('send to customer: paid orders only, link not attachment, admin and app routes guarded', async () => {
  const lib = await source('lib/report-delivery.ts')
  assert.match(lib, /payment_status !== 'paid'/)
  assert.match(lib, /issueOrderToken/)
  assert.doesNotMatch(lib, /attachments/)
  assert.doesNotMatch(lib, /CONTACT_PHONE/)
  assert.match(lib, /mark_report_sent/)
  const admin = await source('app/api/admin/jobs/[id]/send-report/route.ts')
  assert.match(admin, /requireAdmin\(request\)/)
  const app = await source('app/api/app/jobs/[id]/send-report/route.ts')
  assert.match(app, /authenticateInspector\(request\)/)
  assert.match(app, /app_report_sender/)
})

test('customer download: valid link, paid, sent report only; counted; short-lived URL', async () => {
  const route = await source('app/api/order/[token]/report/route.ts')
  assert.match(route, /jobIdForToken/)
  assert.match(route, /payment_status !== 'paid'/)
  assert.match(route, /\.not\('sent_at', 'is', null\)/)
  assert.match(route, /\.eq\('status', 'issued'\)/)
  assert.match(route, /createSignedUrl\(path, 300/)
  assert.match(route, /report\.storage_path/)
  assert.match(route, /record_report_download/)
  assert.match(route, /consume_rate_limit/)
  const page = await source('app/order/[token]/page.tsx')
  assert.match(page, /id="report"/)
  assert.match(page, /<ReportDownload token=\{token\}/)
  const button = await source('components/order/report-download.tsx')
  assert.match(button, /\/api\/order\/\$\{token\}\/report/)
})
