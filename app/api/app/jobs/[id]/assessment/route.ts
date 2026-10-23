import { z } from 'zod'
import { assessmentInput } from '@/lib/inspection-sync'
import { readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'

// Saves the report summary ratings for a job (AS 4349.1 Appendix C and
// AS 4349.3). Newest edit wins; an older edit returns stale: true.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    const input = assessmentInput.parse(await readJsonBody(request, 20_000))
    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const { data, error } = await admin.rpc('app_save_assessment', {
      p_actor_user_id: user.id,
      p_job_id: id,
      p_assessment: input,
    })
    if (error) throw new Error(error.message)
    return Response.json({ ok: true, result: data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return appError(error, 'Unable to save the summary.')
  }
}
