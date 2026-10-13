import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('agent lookup keeps only expected, well-formed fields', async () => {
  // Only parseAgentAnswer is used; it has no imports beyond the file itself.
  const { parseAgentAnswer } = await import('../lib/agent-lookup.ts')
  const parsed = parseAgentAnswer(
    'Here you go: {"agentName":"Jane Smith","agency":"Acme Real Estate","mobile":"0412 345 678 (call)","email":"not-an-email","priceGuide":"$900,000 - $990,000","listingUrl":"javascript:alert(1)","confidence":"HIGH","notes":"x"}',
  )
  assert.equal(parsed.agentName, 'Jane Smith')
  assert.equal(parsed.mobile, '0412 345 678 ()')
  assert.equal(parsed.email, '')
  assert.equal(parsed.listingUrl, '')
  assert.equal(parsed.confidence, 'high')
  assert.equal(parseAgentAnswer('no json here').confidence, 'low')
})

test('agent lookup never saves without the owner', async () => {
  const route = await source('app/api/admin/jobs/[id]/find-agent/route.ts')
  assert.match(route, /requireAdmin\(request\)/)
  assert.doesNotMatch(route, /from\('jobs'\)\.update/)
})

test('Xero: one invoice and payment per job, test orders skipped, tokens encrypted', async () => {
  const xero = await source('lib/xero.ts')
  assert.match(xero, /if \(!record\.invoice_id\)/)
  assert.match(xero, /if \(!record\.payment_id\)/)
  assert.match(xero, /Reference=="\$\{quoted\(order\.public_reference\)\}"/)
  assert.match(xero, /encryptCredentials\(fresh\)/)
  assert.match(xero, /\.eq\('updated_at', data\.updated_at\)/)

  const orders = await source('lib/orders.ts')
  assert.match(orders, /if \(!job\.is_test\) await syncJobToXero\(supabase, jobId\)/)

  const sql = await source('supabase/migrations/20261013100000_xero_invoices.sql')
  assert.match(sql, /revoke all on table public\.integration_accounts from anon, authenticated/)
  assert.match(sql, /revoke all on table public\.xero_records from anon, authenticated/)

  const callback = await source('app/api/admin/xero/callback/route.ts')
  assert.match(callback, /isAdminRequest\(request\)/)
  assert.match(callback, /state !== readCookie\(request, 'ha_xero_state'\)/)
})
