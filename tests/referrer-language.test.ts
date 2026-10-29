import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('Chinese-speaking partners get the Chinese website link and a Chinese email', async () => {
  const { referralLink } = await import('../lib/referrals.ts')
  assert.equal(referralLink('https://homeaudit.com.au', 'js4kq'), 'https://homeaudit.com.au/?ref=js4kq')
  assert.equal(referralLink('https://homeaudit.com.au/', 'js4kq', 'zh'), 'https://homeaudit.com.au/zh?ref=js4kq')
  assert.equal(referralLink('https://homeaudit.com.au', 'js4kq', 'en'), 'https://homeaudit.com.au/?ref=js4kq')
  const emails = await source('lib/order-emails.ts')
  const zh = emails.slice(emails.indexOf('export function referrerLinkEmailZh'))
  assert.match(zh, /中文网站已上线/)
  assert.match(zh, /中文翻译版/)
  assert.match(zh, /英文报告为正式版本/)
  assert.match(zh, /TRANSLATION_FEE_CENTS/)
  assert.doesNotMatch(zh, /\bAI\b/)
  const sender = await source('lib/referrer-emails.ts')
  assert.match(sender, /referralLink\(SITE_URL, data\.ref_code, data\.language\)/)
  assert.match(sender, /chinese \? referrerLinkEmailZh : referrerLinkEmail/)
  const qr = await source('app/api/admin/referrers/qr/route.ts')
  assert.match(qr, /lang'\) === 'zh'/)
  const sql = await source('supabase/migrations/20261103100000_referrer_language.sql')
  assert.match(sql, /language in \('en', 'zh'\)/)
  // The partner list reads all columns, so the new one never breaks it.
  assert.match(await source('lib/referral-store.ts'), /\.select\('\*'\)/)
})
