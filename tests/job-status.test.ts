import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

// HA-20261021-C4CE16 (22 Oct 2026): paid and booked, but shown as "Quote request".
test('saving the job editor does not put back a status from when the page was opened', async () => {
  const editor = await source('components/admin/job-editor.tsx')
  assert.match(editor, /chosenStatus && chosenStatus !== status \? \{ status: chosenStatus \} : \{\}/)
  assert.doesNotMatch(editor, /status: form\.get\('status'\),/)
  assert.match(editor, /defaultValue=\{status\} key=\{status\}/)
})

test('a booked time moves an open job to Booked; clearing it moves Booked back to Scheduling', async () => {
  const notify = await source('lib/booking-notify.ts')
  assert.match(notify, /BOOKABLE_STATUSES = \['quote_received', 'awaiting_customer', 'awaiting_payment', 'paid', 'scheduling'\]/)
  assert.match(notify, /if \(startIso && BOOKABLE_STATUSES\.includes\(before\.status\)\) update\.status = 'confirmed'/)
  assert.match(notify, /if \(!startIso && before\.status === 'confirmed'\) update\.status = 'scheduling'/)
})
