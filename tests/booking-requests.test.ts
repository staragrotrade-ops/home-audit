import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('booking times: one to three, in the future, sorted, no duplicates', async () => {
  const { validSlots } = await import('../lib/booking-slots.ts')
  const now = Date.parse('2026-10-14T00:00:00Z')
  const a = '2026-10-20T00:00:00.000Z'
  const b = '2026-10-17T23:00:00.000Z'
  assert.deepEqual(validSlots([a, b, a], now), [b, a])
  assert.equal(validSlots([], now), null)
  assert.equal(validSlots(['2026-10-13T00:00:00Z'], now), null)
  assert.equal(validSlots(['not a date'], now), null)
  assert.equal(validSlots(['2028-01-01T00:00:00Z'], now), null)
  assert.equal(
    validSlots(['2026-10-15T00:00:00Z', '2026-10-16T00:00:00Z', '2026-10-17T00:00:00Z', '2026-10-18T00:00:00Z'], now),
    null,
  )
})

test('agent link: own table, one reply only, never opens the customer order', async () => {
  const lib = await source('lib/booking-requests.ts')
  assert.match(lib, /from\('booking_requests'\)/)
  assert.doesNotMatch(lib, /job_access_tokens/)
  assert.match(lib, /\.eq\('status', 'sent'\)\s*\.gt\('expires_at'/)
  assert.match(lib, /keepRequestId: request\.id/)

  const sql = await source('supabase/migrations/20261014100000_booking_requests.sql')
  assert.match(sql, /enable row level security/)
  assert.match(sql, /revoke all on table public\.booking_requests from anon, authenticated/)
  assert.match(sql, /cardinality\(slots\) between 1 and 3/)
})

test('agent reply: POST from the page only, same-origin and rate limited', async () => {
  const route = await source('app/api/booking/[token]/route.ts')
  assert.match(route, /export async function POST/)
  assert.doesNotMatch(route, /export async function GET/)
  assert.match(route, /isSameOriginMutation\(request\)/)
  assert.match(route, /consume_rate_limit/)

  const page = await source('app/booking/[token]/page.tsx')
  assert.match(page, /robots: \{ index: false, follow: false \}/)
  assert.match(page, /referrer: 'no-referrer'/)
  // The agent sees the buyer's name, but not their contact details or situation.
  assert.match(page, /buyerNameOf\(job\.customer_snapshot\)/)
  assert.doesNotMatch(page, /customer_snapshot\.(email|mobile)|buyer_situation/)
})

test('a manual booked time closes open requests; the editor no longer sends the time', async () => {
  const notify = await source('lib/booking-notify.ts')
  assert.match(notify, /update\(\{ status: 'cancelled' \}\)/)
  const editor = await source('components/admin/job-editor.tsx')
  assert.doesNotMatch(editor, /confirmedStart/)
})

test('agent email and text name the buyer but not their situation or contacts', async () => {
  const emails = await source('lib/order-emails.ts')
  const start = emails.indexOf('export function bookingRequestEmail')
  const end = emails.indexOf('export function ownerBookingReplyEmail')
  const block = emails.slice(start, end)
  assert.ok(start > 0 && end > start)
  assert.match(block, /buyerPhrase\(input\.buyerName\)/)
  assert.doesNotMatch(block, /situation|mobile|customer/)

  const lib = await source('lib/booking-requests.ts')
  assert.match(lib, /\[customer\?\.first_name, customer\?\.last_name\]/)
})

test('booking links stay out of analytics and search', async () => {
  const visitor = await source('lib/visitor-analytics.ts')
  assert.match(visitor, /'\/booking'/)
  const robots = await source('app/robots.ts')
  assert.match(robots, /'\/booking\/'/)
})

test('inline analytics scripts are valid JavaScript and skip private pages', async () => {
  const component = await source('components/analytics.tsx')
  const blocks = [...component.matchAll(/\{`([\s\S]*?)`\}/g)]
    .map((match) => match[1].replace('${measurementId}', 'G-TEST1234'))
    .filter((block) => block.includes('function'))
  assert.equal(blocks.length, 2)
  for (const block of blocks) {
    // Evaluate the template literal the way the component does, then parse it.
    const code = new Function(`return \`${block}\``)() as string
    assert.doesNotThrow(() => new Function(code))
  }
  const ga = new Function(`return \`${blocks[1]}\``)() as string
  const skip = new RegExp(/\/\^(.+?)\/\.test/.exec(ga)![1])
  assert.ok(skip.test('/booking/abc') && skip.test('/order/abc') && skip.test('/admin'))
  assert.ok(!skip.test('/guides'))
})

test('texts use plain characters: no "&" (phones cut the text there), no curly quotes', async () => {
  const { smsSafe, smsParts, smsHref } = await import('../lib/sms.ts')
  assert.equal(smsSafe('Building & pest “inspection” – 10:00 am'), 'Building and pest "inspection" - 10:00 am')
  assert.doesNotMatch(decodeURIComponent(smsHref('0412 345 678', 'A & B').split('body=')[1]), /&/)
  assert.equal(smsParts('x'.repeat(160)), 1)
  assert.equal(smsParts('x'.repeat(161)), 2)
  assert.equal(smsParts('x'.repeat(306)), 2)

  const emails = await source('lib/order-emails.ts')
  assert.match(emails, /return smsSafe\(/)
  const lib = await source('lib/booking-requests.ts')
  assert.match(lib, /randomBytes\(18\)/)
})

test('the dashboard generates texts; it does not claim to send them', async () => {
  const panel = await source('components/admin/booking-panel.tsx')
  assert.match(panel, /Generate text/)
  assert.match(panel, /sms: 'Text generated for'/)
  assert.doesNotMatch(panel, /window\.location\.href = smsHref/)
  const workflow = await source('components/admin/job-workflow.tsx')
  assert.doesNotMatch(workflow, />Texted</)
})
