import { z } from 'zod'
import {
  DICTATION_FIELDS,
  DICTATION_MAX_BYTES,
  DICTATION_TYPES,
  dictationMimeType,
  transcribeDictation,
} from '@/lib/dictation'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'
export const maxDuration = 60

const context = z.object({
  field: z.enum(DICTATION_FIELDS),
  element: z.string().trim().max(120).optional(),
  severity: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  existing: z.string().max(4000).optional(),
  jobId: z.uuid().optional(),
})

// multipart: "audio" (wav/aac/m4a, up to 4 MB ≈ 2 minutes of 16 kHz wav) and
// the context fields. Returns the transcript and suggested report wording.
// Nothing is stored: the audio and text are not kept on the website.
export async function POST(request: Request) {
  try {
    const { staff } = await authenticateInspector(request)
    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')

    const { data: allowed } = await admin.rpc('consume_rate_limit', {
      p_bucket: 'app_dictation',
      p_client_hash: `staff:${staff.id}`,
      p_window_seconds: 3600,
      p_max_hits: 240,
    })
    if (allowed === false) throw new Error('Dictation limit reached for this hour. Type the note instead.')

    const form = await request.formData()
    const audio = form.get('audio')
    if (!(audio instanceof File) || !audio.size) throw new Error('No recording was received.')
    if (audio.size > DICTATION_MAX_BYTES) throw new Error('The recording is too long. Keep each note under 2 minutes.')
    const mimeType = dictationMimeType(audio.type || 'audio/wav')
    if (!(DICTATION_TYPES as readonly string[]).includes(mimeType)) throw new Error('Unsupported recording format.')

    const input = context.parse({
      field: form.get('field'),
      element: form.get('element') || undefined,
      severity: form.get('severity') || undefined,
      location: form.get('location') || undefined,
      existing: form.get('existing') || undefined,
      jobId: form.get('jobId') || undefined,
    })

    const started = Date.now()
    const result = await transcribeDictation(new Uint8Array(await audio.arrayBuffer()), mimeType, input)

    await admin.from('audit_events').insert({
      job_id: input.jobId || null,
      event_type: 'app_dictation',
      actor_type: 'staff',
      actor_id: staff.id,
      event_data: { field: input.field, bytes: audio.size, language: result.language, ms: Date.now() - started },
    })

    return Response.json({ ok: true, result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return appError(error, 'Dictation failed.')
  }
}
