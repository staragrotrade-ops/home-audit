// Server-only. Turns an inspector's spoken note (English, Chinese or both)
// into report wording with Google Gemini. The inspector always reviews the
// result in the app before it is used: AI assists, the inspector decides.

const API = 'https://generativelanguage.googleapis.com/v1beta/models'

export const DICTATION_MAX_BYTES = 4 * 1024 * 1024
export const DICTATION_TYPES = ['audio/wav', 'audio/x-wav', 'audio/aac', 'audio/mp4', 'audio/m4a', 'audio/mpeg', 'audio/ogg', 'audio/flac'] as const
export const DICTATION_FIELDS = ['defect', 'observation', 'recommendation', 'title', 'limitation'] as const
export type DictationField = (typeof DICTATION_FIELDS)[number]

export type DictationContext = {
  field: DictationField
  element?: string
  severity?: string
  location?: string
  existing?: string
  /** Room / area names of this job, so the AI can pick the matching one. */
  rooms?: string
}

/** For field "defect": the whole defect, split into the editor's fields. */
export type DictatedDefect = {
  title: string
  observation: string
  recommendation: string
  location: string
}

export type DictationResult = {
  transcript: string
  language: string
  text: string
  notes: string
  defect?: DictatedDefect
}

const FIELD_GUIDE: Record<DictationField, string> = {
  defect:
    'a complete DEFECT ENTRY. Put the observation in "text" as well as in "defect.observation".',
  observation:
    'an OBSERVATION: what was seen, where, extent and evidence (e.g. moisture meter readings). Plain past tense, e.g. "Cracked roof tiles were observed to the rear roof slope (approx. 4)." Do not add recommendations.',
  recommendation:
    'a RECOMMENDATION: the action the client should take and who should do it, e.g. "Engage a licensed roof plumber to replace the cracked tiles."',
  title: 'a SHORT TITLE of at most 8 words, no full stop, e.g. "Cracked roof tiles – rear slope".',
  limitation:
    'an ACCESS LIMITATION for an area of the property: what could not be inspected and why, e.g. "Floor coverings and stored items in the wardrobe restricted inspection of the floor." Do not describe defects.',
}

export function dictationPrompt(context: DictationContext) {
  return [
    'You help a registered building and timber pest inspector in Victoria, Australia, write an AS 4349.1 / AS 4349.3 inspection report.',
    'The attached audio is the inspector speaking on site, in English, Mandarin Chinese, or a mix of both. There may be background noise.',
    '1. transcript: transcribe exactly what was said, in the original language(s).',
    '2. language: "en", "zh" or "mixed".',
    `3. text: rewrite it in professional Australian English as ${FIELD_GUIDE[context.field]}`,
    'Write in the voice of the building inspector writing their own report: confident, factual and concise, in the third person or passive voice used in Australian pre-purchase reports (e.g. "Cracking was observed…", "It is recommended that…"). Never mention the AI, the recording or "the inspector said".',
    context.field === 'defect'
      ? [
          '4. defect: split what was said into the defect entry fields:',
          '   - title: at most 8 words, no full stop, e.g. "Cracked roof tiles – rear slope".',
          '   - observation: what was seen, where, extent and evidence, in past tense. No recommendation here.',
          '   - recommendation: the action and the trade, e.g. "Engage a licensed roof plumber to replace the cracked tiles." Empty string if none was said or clearly implied by the inspector.',
          context.rooms
            ? `   - location: the room or area. If it matches one of these job areas use that name exactly: ${context.rooms.slice(0, 1500)}. Otherwise the place the inspector said, or an empty string.`
            : '   - location: the room or area the inspector said, or an empty string.',
        ].join('\n')
      : '4. defect: return empty strings for every field.',
    'Use standard building terms (e.g. 瓦片 = roof tiles, 水槽/天沟 = gutters, 落水管 = downpipes, 白蚁 = termites, 渗水 = water ingress, 裂缝 = cracking, 地板下 = subfloor, 屋顶空间 = roof space).',
    'Keep every number, measurement, quantity and location the inspector said. Remove filler words and repetition.',
    'Never add a defect, cause, severity, quantity or opinion the inspector did not say. If something is unclear, write [unclear] rather than guessing.',
    '5. notes: one short sentence to the inspector if anything was unclear or you changed meaning-bearing words; otherwise an empty string.',
    context.element ? `Context – element: ${context.element}.` : '',
    context.severity ? `Context – classification chosen by the inspector: ${context.severity}.` : '',
    context.location ? `Context – location: ${context.location}.` : '',
    context.existing ? `The field already contains: "${context.existing.slice(0, 1500)}". Write only the new part; do not repeat it.` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

// Normalises the model's JSON reply; never trusts its shape.
export function parseDictationReply(raw: string): DictationResult {
  let json: Record<string, unknown> = {}
  try {
    const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '')
    const parsed = JSON.parse(trimmed)
    if (parsed && typeof parsed === 'object') json = parsed as Record<string, unknown>
  } catch {
    throw new Error('The AI reply could not be read. Try again.')
  }
  const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')
  const result = {
    transcript: text(json.transcript, 6000),
    language: ['en', 'zh', 'mixed'].includes(String(json.language)) ? String(json.language) : 'en',
    text: text(json.text, 4000),
    notes: text(json.notes, 500),
  } as DictationResult
  const defect = json.defect && typeof json.defect === 'object' ? (json.defect as Record<string, unknown>) : null
  if (defect) {
    const fields = {
      title: text(defect.title, 120).replace(/\.$/, ''),
      observation: text(defect.observation, 4000),
      recommendation: text(defect.recommendation, 2000),
      location: text(defect.location, 120),
    }
    if (Object.values(fields).some(Boolean)) result.defect = fields
  }
  if (!result.transcript && !result.text) throw new Error('No speech was recognised. Speak closer to the phone and try again.')
  return result
}

export function dictationMimeType(type: string) {
  const clean = type.split(';')[0].trim().toLowerCase()
  if (clean === 'audio/x-wav') return 'audio/wav'
  if (clean === 'audio/m4a') return 'audio/mp4'
  return clean
}

export async function transcribeDictation(audio: Uint8Array, mimeType: string, context: DictationContext) {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('AI dictation is not set up on the website (GEMINI_API_KEY).')
  const model = process.env.GEMINI_DICTATION_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-flash'

  const response = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: dictationPrompt(context) },
            { inline_data: { mime_type: mimeType, data: Buffer.from(audio).toString('base64') } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            transcript: { type: 'STRING' },
            language: { type: 'STRING', enum: ['en', 'zh', 'mixed'] },
            text: { type: 'STRING' },
            notes: { type: 'STRING' },
            defect: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                observation: { type: 'STRING' },
                recommendation: { type: 'STRING' },
                location: { type: 'STRING' },
              },
              required: ['title', 'observation', 'recommendation', 'location'],
            },
          },
          required: ['transcript', 'language', 'text', 'notes', 'defect'],
        },
      },
    }),
    signal: AbortSignal.timeout(55_000),
  })
  const result = (await response.json().catch(() => ({}))) as {
    error?: { message?: string }
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  if (!response.ok) throw new Error(`Google AI could not process the recording: ${result.error?.message || response.status}`)
  const answer = (result.candidates?.[0]?.content?.parts || []).map((part) => part.text || '').join('')
  return parseDictationReply(answer)
}
