import { z } from 'zod'
import { adminJson, requireAdmin } from '@/lib/admin-api'
import { syncJobCalendar } from '@/lib/google-calendar'

export const runtime = 'nodejs'

// Puts the job in Google Calendar now (or updates or removes its event).
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase
  const { id } = await context.params
  if (!z.uuid().safeParse(id).success) return adminJson({ ok: false, error: 'Invalid job.' }, 400)
  const result = await syncJobCalendar(supabase, id)
  return adminJson(result.ok ? { ok: true, action: result.action } : { ok: false, error: result.error }, result.ok ? 200 : 502)
}
