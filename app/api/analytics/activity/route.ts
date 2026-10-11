import { z } from 'zod'
import { ANALYTICS_MAX_BODY_BYTES, analyticsStore, noContent } from '@/lib/analytics-server'
import { readJsonBody } from '@/lib/request-guard'

export const runtime = 'nodejs'

const schema = z.object({
  action: z.enum(['start', 'heartbeat', 'visibility', 'exit']),
  sessionId: z.uuid(),
  pageInstanceId: z.uuid(),
  path: z.string().startsWith('/').max(300),
  activeSeconds: z.number().int().min(0).max(60).default(0),
  exitReason: z.string().max(40).optional(),
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

  const { error } = await supabase.rpc('record_page_activity', {
    p_session_id: input.sessionId,
    p_page_instance_id: input.pageInstanceId,
    p_path: input.path,
    p_active_seconds: input.activeSeconds,
    p_action: input.action,
    p_exit_reason: input.exitReason || null,
  })
  if (error) console.error('analytics_activity_failed', { code: error.code })
  return noContent()
}
