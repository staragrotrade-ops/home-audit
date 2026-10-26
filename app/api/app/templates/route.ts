import { templateBatch } from '@/lib/inspection-sync'
import { readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'

// Adds descriptions to the shared defect library (saved from the app when a
// defect is saved). Keyed by the phone's id, so a retry is harmless. A title
// that already exists for the element is not duplicated: the reply maps the
// phone's id to the existing description.
export async function POST(request: Request) {
  try {
    const { user } = await authenticateInspector(request)
    const input = templateBatch.parse(await readJsonBody(request, 300_000))
    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const { data, error } = await admin.rpc('app_save_defect_templates', {
      p_actor_user_id: user.id,
      p_templates: input.templates,
    })
    if (error) throw new Error(error.message)
    return Response.json({ ok: true, result: data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return appError(error, 'Unable to save to the defect library.')
  }
}
