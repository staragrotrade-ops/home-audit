import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

const c = await import('../lib/calendar-event.ts')

test('calendar event: one fixed id per job, 2 hours by default, Melbourne time', () => {
  const id = c.calendarEventId('3F2504E0-4F89-11D3-9A0C-0305E82C3301')
  assert.equal(id, 'ha3f2504e04f8911d39a0c0305e82c3301')
  assert.match(id, /^[a-v0-9]{5,1024}$/)
  assert.equal(c.eventEnd('2026-10-20T23:00:00Z', null), '2026-10-21T01:00:00.000Z')
  assert.equal(c.eventEnd('2026-10-20T23:00:00Z', '2026-10-21T00:30:00Z'), '2026-10-21T00:30:00.000Z')
  assert.equal(c.eventEnd('2026-10-20T23:00:00Z', '2026-10-20T22:00:00Z'), '2026-10-21T01:00:00.000Z')

  const event = c.buildCalendarEvent({
    reference: 'HA-20261013-10EDDF',
    service: 'Building and pest inspection',
    address: '18 Art Deco Drive',
    suburb: 'Deanside',
    postcode: '3336',
    start: '2026-10-20T23:00:00Z',
    end: null,
    paymentStatus: 'paid',
    totalCents: 55000,
    clientName: 'Ann Lee',
    phone: '0400 000 000',
    email: 'ann@example.com',
    buyerSituation: 'I am attending an auction',
    access: 'The selling agent',
    agent: 'Jane Smith · ABC Real Estate · 0412 345 678',
    notes: '',
    adminUrl: 'https://homeaudit.com.au/admin?q=HA-20261013-10EDDF#jobs',
  })
  assert.equal(event.summary, 'HA – DEANSIDE')
  assert.equal(event.location, '18 Art Deco Drive, Deanside 3336')
  assert.equal(event.start.timeZone, 'Australia/Melbourne')
  assert.match(event.description, /Job: HA-20261013-10EDDF/)
  assert.match(event.description, /Payment: PAID – \$550\.00 incl\. GST/)
  assert.match(event.description, /Agent: Jane Smith/)
  assert.doesNotMatch(event.description, /Notes:/)
})

test('booked times go to the calendar automatically; problems never stop a booking', async () => {
  const notify = await source('lib/booking-notify.ts')
  assert.match(notify, /await syncJobCalendar\(supabase, id\)/)
  const lib = await source('lib/google-calendar.ts')
  assert.match(lib, /if \(job\.is_test\) return \{ ok: true, action: 'skipped' \}/)
  assert.match(lib, /!job\.confirmed_start \|\| job\.status === 'cancelled'/)
  assert.match(lib, /encryptCredentials\(token\)/)
  assert.match(lib, /Never throws/)
  const patch = await source('app/api/admin/jobs/[id]/route.ts')
  assert.match(patch, /syncJobCalendar\(supabase, id\)/)
  const callback = await source('app/api/admin/google/callback/route.ts')
  assert.match(callback, /state !== readCookie\(request, 'ha_google_state'\)/)
  assert.match(callback, /isAdminRequest\(request\)/)
})
