import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('quote form asks for agent email and phone, and no longer for an access contact', async () => {
  const form = await source('components/quote-flow.tsx')
  assert.match(form, /htmlFor="agent_email"/)
  assert.match(form, /htmlFor="agent_phone"/)
  assert.doesNotMatch(form, /htmlFor="access_contact"/)
  assert.match(await source('lib/quote-schema.ts'), /agent_phone: z/)
})

test('the quote saves the agent details on the job, apart from the database function', async () => {
  const route = await source('app/api/quote/route.ts')
  assert.match(route, /const \{ agent_phone: agentPhone, form_language: formLanguage, \.\.\.jobFields \} = fields/)
  assert.match(route, /update\(\{ agent_email: fields\.agent_email \|\| null, agent_phone: agentPhone \|\| null \}\)/)
})

test('after payment the order page shows the agent details given before', async () => {
  const page = await source('app/order/[token]/page.tsx')
  assert.match(page, /agentPhone: job\.agent_phone \|\| ''/)
  assert.match(page, /agentEmail: job\.agent_email \|\| job\.customer_snapshot\?\.agent_email \|\| ''/)
  const form = await source('components/order/booking-details-form.tsx')
  assert.match(form, /defaultValue=\{initial\.agentPhone\}/)
  assert.match(form, /defaultValue=\{initial\.agentEmail\}/)
  assert.match(form, /initial\.accessChoice \|\| \(knownAgent \? 'agent' : ''\)/)
  assert.match(await source('lib/orders.ts'), /agent_phone,agent_email,/)
})

test('saved agent details are kept; a different value from the customer goes to the notes', async () => {
  const route = await source('app/api/order/[token]/details/route.ts')
  assert.match(route, /if \(!saved\) update\[column\] = given/)
  assert.match(route, /Customer's agent details:/)
})
