// Server-only. Before a report is downloaded, the customer confirms a
// 6-digit code sent to the order's email address, so a forwarded link alone
// does not open the report. A confirmed browser is remembered for 12 hours.
import { createHash, createHmac, randomInt, timingSafeEqual } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { EmailMessage } from '@/lib/email'

export const DOWNLOAD_COOKIE = 'ha_report_access'
export const DOWNLOAD_HOURS = 12
export const CODE_MINUTES = 15
export const CODE_ATTEMPTS = 5

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET || process.env.RATE_LIMIT_SECRET
  if (!value) throw new Error('The download check is not configured.')
  return value
}

export function codeHash(jobId: string, code: string) {
  return createHash('sha256').update(`${jobId}|${code}`).digest('hex')
}

export function newDownloadCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export function maskEmail(email: string) {
  const [name, domain] = email.split('@')
  if (!domain) return email
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(1, name.length - 2))}@${domain}`
}

function sign(payload: string) {
  return createHmac('sha256', secret()).update(`report-download|${payload}`).digest('base64url')
}

/** Cookie value: "<jobId>.<expires>.<signature>", several jobs comma-separated. */
export function grantAccess(existing: string | undefined, jobId: string, now = Date.now()) {
  const expires = now + DOWNLOAD_HOURS * 3_600_000
  const entry = `${jobId}.${expires}.${sign(`${jobId}.${expires}`)}`
  const kept = (existing || '')
    .split(',')
    .filter((part) => part && !part.startsWith(`${jobId}.`))
    .slice(-4)
  return [...kept, entry].join(',')
}

export function hasAccess(cookie: string | undefined, jobId: string, now = Date.now()) {
  for (const part of (cookie || '').split(',')) {
    const [id, expires, signature] = part.split('.')
    if (id !== jobId || !expires || !signature) continue
    if (Number(expires) < now) continue
    const expected = Buffer.from(sign(`${id}.${expires}`))
    const given = Buffer.from(signature)
    if (expected.length === given.length && timingSafeEqual(expected, given)) return true
  }
  return false
}

export function downloadCodeEmail(input: { to: string; code: string; address: string }): EmailMessage {
  return {
    to: input.to,
    subject: `Your report download code: ${input.code}`,
    text: `Your code to download the inspection report for ${input.address} is:

${input.code}

It works for ${CODE_MINUTES} minutes. If you did not ask for it, you can ignore this email.

Home Audit`,
  }
}

/** Checks a code; counts attempts. */
export async function checkDownloadCode(supabase: SupabaseClient, jobId: string, code: string) {
  const { data: row } = await supabase
    .from('report_download_codes')
    .select('id,code_hash,attempts,expires_at')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!row || new Date(row.expires_at as string) < new Date()) return 'expired' as const
  if ((row.attempts as number) >= CODE_ATTEMPTS) return 'locked' as const
  if (row.code_hash !== codeHash(jobId, code)) {
    await supabase.from('report_download_codes').update({ attempts: (row.attempts as number) + 1 }).eq('id', row.id)
    return 'wrong' as const
  }
  await supabase.from('report_download_codes').update({ attempts: CODE_ATTEMPTS, expires_at: new Date().toISOString() }).eq('id', row.id)
  return 'ok' as const
}
