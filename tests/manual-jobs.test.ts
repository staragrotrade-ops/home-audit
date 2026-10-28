import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('manual jobs: created in admin, paid by hand, online payments untouched', async () => {
  const sql = await source('supabase/migrations/20261101100000_manual_jobs.sql')
  assert.match(sql, /'phone', nullif\(p ->> 'preferred_date'/)
  assert.match(sql, /This job was paid online; change it in Stripe instead/)
  assert.match(sql, /manual_payment_method in \('bank_transfer', 'cash', 'card', 'other'\)/)
  for (const fn of ['create_manual_job(jsonb)', 'set_manual_payment(uuid, boolean, text, numeric, text, timestamptz)']) {
    assert.ok(sql.includes(`grant execute on function public.${fn} to service_role`), fn)
    assert.ok(sql.includes(`revoke all on function public.${fn} from public, anon, authenticated`), fn)
  }
  const create = await source('app/api/admin/jobs/route.ts')
  assert.match(create, /requireAdmin\(request\)/)
  const pay = await source('app/api/admin/jobs/[id]/manual-payment/route.ts')
  assert.match(pay, /requireAdmin\(request\)/)
  // Hand-paid jobs are invoiced by hand: no automatic email or Xero invoice.
  assert.doesNotMatch(pay, /sendEmail|syncJobToXero|notifyPaid/)
  // The job list reads all columns, so a new column never breaks it.
  assert.match(await source('app/admin/page.tsx'), /'\*,job_assignments\(staff_id\)/)
})
