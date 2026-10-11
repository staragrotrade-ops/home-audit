import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { cleanSearch, formatDuration, percent } from '../lib/admin-format.ts'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

const MIGRATION = 'supabase/migrations/20261011120000_admin_analytics_and_app.sql'

test('admin sessions are signed, expire and need both secrets', async () => {
  delete process.env.ADMIN_SESSION_SECRET
  delete process.env.ADMIN_DASHBOARD_PASSWORD
  const session = await import('../lib/admin-session.ts')

  assert.equal(session.isAdminConfigured(), false)
  assert.equal(session.verifyAdminPassword('anything-at-all'), false)

  process.env.ADMIN_SESSION_SECRET = 'x'.repeat(32)
  process.env.ADMIN_DASHBOARD_PASSWORD = 'correct horse battery'
  assert.equal(session.isAdminConfigured(), true)
  assert.equal(session.verifyAdminPassword('correct horse battery'), true)
  assert.equal(session.verifyAdminPassword('correct horse batterz'), false)

  const token = session.createAdminSessionToken()
  assert.equal(session.verifyAdminSessionToken(token), true)
  assert.equal(session.verifyAdminSessionToken(`${token}x`), false)
  assert.equal(session.verifyAdminSessionToken(token.replace(/^admin\.\d+/, 'admin.9999999999')), false)
  assert.equal(session.verifyAdminSessionToken('admin.1.abc'), false)

  process.env.ADMIN_SESSION_SECRET = 'y'.repeat(32)
  assert.equal(session.verifyAdminSessionToken(token), false, 'rotating the secret ends sessions')

  delete process.env.ADMIN_SESSION_SECRET
  delete process.env.ADMIN_DASHBOARD_PASSWORD
})

test('admin formatting helpers', () => {
  assert.equal(formatDuration(42), '42s')
  assert.equal(formatDuration(125), '2m 05s')
  assert.equal(formatDuration(3720), '1h 02m')
  assert.equal(percent(1, 0), '—')
  assert.equal(percent(1, 4), '25%')
  assert.equal(cleanSearch(' Glen,(Waverley)* '), 'GlenWaverley')
})

test('the migration keeps customer data away from the public and inspectors', async () => {
  const sql = await source(MIGRATION)

  for (const table of ['analytics_events', 'page_activity', 'staff', 'job_assignments', 'inspection_reports']) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`))
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from anon, authenticated`))
  }
  assert.match(sql, /revoke all on table public\.inspector_job_feed from anon, authenticated/)
  assert.match(sql, /grant select on table public\.inspector_job_feed to authenticated/)
  assert.doesNotMatch(sql, /grant [^;]*\bto anon\b/i)
  // Inspectors never receive prices, payment ids or internal notes.
  const jobGrant = sql.match(/grant select \(([^)]*)\)\s+on public\.jobs to authenticated/)
  assert.ok(jobGrant, 'jobs column grant is present')
  assert.doesNotMatch(jobGrant[1], /quote_total|internal_notes|stripe|xero/)
  assert.match(sql, /'inspection-reports', 'inspection-reports', false/)
  assert.doesNotMatch(sql, /ip_address|\binet\b/)
})

test('admin and app routes check who is calling', async () => {
  const adminRoutes = [
    'app/api/admin/jobs/[id]/route.ts',
    'app/api/admin/staff/route.ts',
    'app/api/admin/staff/[id]/route.ts',
    'app/api/admin/reports/[reportId]/download/route.ts',
  ]
  for (const path of adminRoutes) {
    assert.match(await source(path), /requireAdmin\(request/, `${path} must require an admin`)
  }

  const appRoutes = [
    'app/api/app/account/route.ts',
    'app/api/app/jobs/route.ts',
    'app/api/app/jobs/[id]/route.ts',
    'app/api/app/jobs/[id]/progress/route.ts',
    'app/api/app/jobs/[id]/report-upload/route.ts',
    'app/api/app/jobs/[id]/report-complete/route.ts',
    'app/api/app/jobs/[id]/reports/route.ts',
    'app/api/app/reports/[reportId]/download/route.ts',
  ]
  for (const path of appRoutes) {
    assert.match(await source(path), /authenticateInspector\(request\)/, `${path} must authenticate`)
  }

  const page = await source('app/admin/page.tsx')
  assert.match(page, /if \(!isAdminConfigured\(\)\) notFound\(\)/)
  assert.match(page, /redirect\('\/admin\/login'\)/)

  const login = await source('app/api/admin/login/route.ts')
  assert.match(login, /consume_rate_limit/)
})

test('visitor tracking skips admin pages, bots, previews and the owner', async () => {
  const client = await source('lib/visitor-analytics.ts')
  assert.match(client, /EXCLUDED_PATH_PREFIXES = \['\/admin', '\/api'\]/)
  assert.match(client, /sessionStorage/)
  assert.doesNotMatch(client, /document\.cookie/)

  const server = await source('lib/analytics-server.ts')
  assert.match(server, /VERCEL_ENV !== 'production'/)
  assert.match(server, /isLikelyBot\(request\)/)
  assert.match(server, /isExcludedRequest\(request\)/)

  const layout = await source('app/layout.tsx')
  assert.match(layout, /<VisitorTracker \/>/)
})

test('online quote submission still needs its own switch', async () => {
  const route = await source('app/api/quote/route.ts')
  assert.match(route, /intakeMode === 'submit' && process\.env\.QUOTE_SUBMISSION_ENABLED !== 'true'/)
  assert.match(route, /consume_rate_limit/)

  const flow = await source('components/quote-flow.tsx')
  assert.match(flow, /requestBody\(draft, 'email_handoff'\)/)
})

test('quote copies and rate-limit hashes are protected', async () => {
  const route = await source('app/api/quote/route.ts')
  assert.match(route, /intakeMode === 'email_handoff' && !isSameOriginMutation\(request\)/)
  assert.match(route, /VERCEL_ENV !== 'production'/)
  assert.match(route, /p_bucket: 'quote_all'/)

  const guard = await source('lib/request-guard.ts')
  assert.match(guard, /createHmac\('sha256', key\)/)
  assert.doesNotMatch(guard, /createHash\(/)

  const complete = await source('app/api/app/jobs/[id]/report-complete/route.ts')
  assert.match(complete, /storedSize !== input\.sizeBytes/)
})
