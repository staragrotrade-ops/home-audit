import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'
import { readJsonBody } from '@/lib/request-guard'
import { TRANSLATE_MAX_CHARS, TRANSLATE_MAX_TEXTS, TRANSLATION_LANGS, translateTexts } from '@/lib/translation'

export const runtime = 'nodejs'
export const maxDuration = 60

const schema = z.object({
  lang: z.enum(TRANSLATION_LANGS),
  texts: z.array(z.string().max(TRANSLATE_MAX_CHARS)).max(TRANSLATE_MAX_TEXTS),
})

// Translates report text for the Chinese copy of a report (issuers only).
export async function POST(request: Request) {
  try {
    const { staff } = await authenticateInspector(request)
    if (staff.role !== 'admin' && !staff.can_issue_reports) {
      throw new Error('Your account cannot issue reports.')
    }
    const input = schema.parse(await readJsonBody(request, 1_500_000))
    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const { data: allowed } = await admin.rpc('consume_rate_limit', {
      p_bucket: 'app_translate',
      p_client_hash: `staff:${staff.id}`,
      p_window_seconds: 3600,
      p_max_hits: 60,
    })
    if (allowed === false) throw new Error('Translation limit reached for this hour. Try again later.')
    const translations = await translateTexts(admin, input.lang, input.texts)
    return Response.json({ ok: true, translations }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return appError(error, 'Translation failed.')
  }
}
