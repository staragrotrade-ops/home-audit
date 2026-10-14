import { z } from 'zod'
import { ANALYTICS_MAX_BODY_BYTES, analyticsStore, noContent } from '@/lib/analytics-server'
import { deviceType, readJsonBody, visitorCountry } from '@/lib/request-guard'

export const runtime = 'nodejs'

const text = (max: number) => z.string().max(max).default('')

const schema = z.object({
  eventName: z.enum([
    'page_view',
    'quote_started',
    'quote_step',
    'quote_submitted',
    'quote_email_handoff',
    'phone_clicked',
    'email_clicked',
  ]),
  eventKey: text(120),
  path: z.string().startsWith('/').max(300),
  visit: z.object({
    sessionId: z.uuid(),
    landingPath: text(300),
    referrer: text(500),
    utmSource: text(120),
    utmMedium: text(120),
    utmCampaign: text(160),
    refCode: z.union([z.literal(''), z.string().regex(/^[a-z0-9]{3,12}$/)]).default(''),
  }),
  metadata: z
    .record(z.string().max(40), z.union([z.string().max(120), z.number(), z.boolean()]))
    .default({}),
  website: z.string().max(0).default(''),
})

export async function POST(request: Request) {
  const supabase = analyticsStore(request)
  if (!supabase) return noContent()

  let input: z.infer<typeof schema>
  try {
    input = schema.parse(await readJsonBody(request, ANALYTICS_MAX_BODY_BYTES))
  } catch {
    return noContent()
  }
  if (Object.keys(input.metadata).length > 10) return noContent()

  const { error } = await supabase.from('analytics_events').upsert(
    {
      session_id: input.visit.sessionId,
      event_name: input.eventName,
      event_key: input.eventKey,
      path: input.path,
      landing_path: input.visit.landingPath,
      referrer: input.visit.referrer,
      utm_source: input.visit.utmSource,
      utm_medium: input.visit.utmMedium,
      utm_campaign: input.visit.utmCampaign,
      ...(input.visit.refCode ? { ref_code: input.visit.refCode } : {}),
      device: deviceType(request),
      country: visitorCountry(request),
      metadata: input.metadata,
    },
    { onConflict: 'session_id,event_name,event_key', ignoreDuplicates: true },
  )
  if (error) console.error('analytics_event_failed', { code: error.code })
  return noContent()
}
