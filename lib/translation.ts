// Server-only. Chinese (Simplified) translation of report text with Google
// Gemini, for the paid translation add-on. Standard wording repeats across
// reports, so every translated string is cached.
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export const TRANSLATION_FEE_CENTS = 5000
export const TRANSLATION_LANGS = ['zh'] as const
export type TranslationLang = (typeof TRANSLATION_LANGS)[number]

export const TRANSLATE_MAX_TEXTS = 400
export const TRANSLATE_MAX_CHARS = 4000

const API = 'https://generativelanguage.googleapis.com/v1beta/models'

// Fixed renderings so every report uses the same words.
export const ZH_GLOSSARY: Record<string, string> = {
  'Major defect': '重大缺陷',
  'Minor defect': '轻微缺陷',
  'Safety hazard': '安全隐患',
  'Further investigation recommended': '建议进一步检查',
  'Active termites': '活白蚁',
  'Termite damage': '白蚁损害',
  'Condition conducive to timber pests': '易引发木材害虫的条件',
  'timber pest': '木材害虫',
  'subfloor': '地板下空间',
  'roof space': '屋顶空间',
  'roof void': '屋顶空间',
  'eaves': '屋檐',
  'gutter': '排水槽',
  'downpipe': '落水管',
  'flashing': '泛水板',
  'stumps': '地桩',
  'bearers and joists': '托梁与格栅',
  'weep holes': '泄水孔',
  'damp-proof course': '防潮层',
  'waterproofing': '防水层',
  'licensed': '持牌',
  'structural engineer': '结构工程师',
  'plumber': '水管工',
  'electrician': '电工',
  'Inspection Agreement': '验房协议',
  'AS 4349.1': 'AS 4349.1',
  'AS 4349.3': 'AS 4349.3',
}

export function translationKey(lang: string, text: string) {
  return createHash('sha256').update(`v1|${lang}|${text}`).digest('hex')
}

export function translationPrompt(lang: TranslationLang, texts: string[]) {
  const glossary = Object.entries(ZH_GLOSSARY)
    .map(([en, zh]) => `${en} = ${zh}`)
    .join('; ')
  return [
    'Translate each item of a building and timber pest inspection report written in Australian English into Simplified Chinese for a property buyer in Melbourne.',
    'Write as a professional building inspector would in Chinese: clear, formal and accurate. Keep the meaning exactly; do not add, soften or remove anything.',
    'Keep numbers, measurements, units, defect numbers such as #3, standard numbers such as AS 4349.1, brand names, street addresses and people’s names unchanged.',
    `Use these terms: ${glossary}.`,
    'Return a JSON array of strings with exactly one translation per input item, in the same order. If an item is a single label, translate it as a label.',
    `Items (JSON array):\n${JSON.stringify(texts)}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export function parseTranslationReply(raw: string, count: number) {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, ''))
  } catch {
    throw new Error('The translation could not be read. Try again.')
  }
  if (!Array.isArray(parsed) || parsed.length !== count) throw new Error('The translation was incomplete. Try again.')
  return parsed.map((item) => (typeof item === 'string' ? item.trim().slice(0, 8000) : ''))
}

async function callGemini(prompt: string) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Translation is not set up on the website (GEMINI_API_KEY).')
  const model = process.env.GEMINI_TRANSLATION_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-flash'
  const response = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: { type: 'ARRAY', items: { type: 'STRING' } },
      },
    }),
    signal: AbortSignal.timeout(55_000),
  })
  const result = (await response.json().catch(() => ({}))) as {
    error?: { message?: string }
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  if (!response.ok) throw new Error(`Translation failed: ${result.error?.message || response.status}`)
  return (result.candidates?.[0]?.content?.parts || []).map((part) => part.text || '').join('')
}

/** Translates the texts (cached), in batches small enough for one call. */
export async function translateTexts(supabase: SupabaseClient, lang: TranslationLang, texts: string[]) {
  const out = new Map<string, string>()
  const unique = [...new Set(texts.map((text) => text.trim()).filter(Boolean))]
  const keys = new Map(unique.map((text) => [text, translationKey(lang, text)]))
  for (let i = 0; i < unique.length; i += 200) {
    const slice = unique.slice(i, i + 200)
    const { data } = await supabase
      .from('translation_cache')
      .select('hash,translated')
      .in('hash', slice.map((text) => keys.get(text)!))
    const byHash = new Map((data || []).map((row) => [row.hash as string, row.translated as string]))
    for (const text of slice) {
      const hit = byHash.get(keys.get(text)!)
      if (hit) out.set(text, hit)
    }
  }
  const missing = unique.filter((text) => !out.has(text))
  // Batches of about 4,000 characters, translated in parallel, keep each
  // request well inside the time limit.
  const batches: string[][] = []
  let batch: string[] = []
  let size = 0
  for (const text of missing) {
    if (batch.length && size + text.length > 4000) {
      batches.push(batch)
      batch = []
      size = 0
    }
    batch.push(text)
    size += text.length
  }
  if (batch.length) batches.push(batch)
  await Promise.all(
    batches.map(async (items) => {
      const translated = parseTranslationReply(await callGemini(translationPrompt(lang, items)), items.length)
      items.forEach((text, index) => out.set(text, translated[index] || text))
      await supabase
        .from('translation_cache')
        .upsert(
          items.map((text, index) => ({ hash: keys.get(text)!, lang, translated: translated[index] || text })),
          { onConflict: 'hash' },
        )
    }),
  )
  return texts.map((text) => out.get(text.trim()) ?? text)
}
