import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path: string) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8')
}

test('translation: one reply per item, fixed terms, cached by text', async () => {
  const t = await import('../lib/translation.ts')
  assert.equal(t.TRANSLATION_FEE_CENTS, 5000)
  assert.deepEqual(t.parseTranslationReply('["重大缺陷", "轻微缺陷"]', 2), ['重大缺陷', '轻微缺陷'])
  assert.throws(() => t.parseTranslationReply('["只有一个"]', 2), /incomplete/)
  assert.throws(() => t.parseTranslationReply('not json', 1), /could not be read/)
  assert.notEqual(t.translationKey('zh', 'Gutter'), t.translationKey('zh', 'Gutters'))
  const prompt = t.translationPrompt('zh', ['Major defect'])
  assert.match(prompt, /Simplified Chinese/)
  assert.match(prompt, /Major defect = 重大缺陷/)
  assert.match(prompt, /do not add, soften or remove/)
})

test('translation add-on: chosen before payment; price moves; app can read it', async () => {
  const sql = await source('supabase/migrations/20261031100000_report_translation.sql')
  assert.match(sql, /grant select \(translation_zh\) on public\.jobs to authenticated/)
  assert.match(sql, /j\.translation_zh\nfrom public\.jobs j/)
  assert.match(sql, /and j\.intake_channel <> 'report_transfer'/)
  assert.match(sql, /This order is already paid/)
  assert.match(sql, /grant execute on function public\.set_order_translation\(uuid, boolean, numeric\) to service_role/)
  const route = await source('app/api/order/[token]/translation/route.ts')
  assert.match(route, /isPayable\(job\)/)
  assert.match(route, /expireOpenSessions/)
  const translate = await source('app/api/app/translate/route.ts')
  assert.match(translate, /authenticateInspector\(request\)/)
  assert.match(translate, /can_issue_reports/)
})

test('customer wording does not mention AI; English stays the official version', async () => {
  for (const path of ['components/order/translation-option.tsx', 'lib/report-delivery.ts', 'components/order/report-download.tsx']) {
    const text = await source(path)
    assert.doesNotMatch(text, /\bAI\b|machine|Gemini/, path)
  }
  assert.match(await source('components/order/translation-option.tsx'), /English\s+report is the official version/)
  const complete = await source('app/api/app/jobs/[id]/report-complete/route.ts')
  assert.match(complete, /zh_path: zhPath/)
  const download = await source('app/api/order/[token]/report/route.ts')
  assert.match(download, /lang'\) === 'zh'/)
})
