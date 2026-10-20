import { z } from 'zod'
import { defectBatch, normaliseDefect, rootLinkProblem } from '@/lib/inspection-sync'
import { readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'

// Uploads a batch of defects edited on the phone (created, changed or
// deleted). Safe to resend: defects are keyed by the phone's id and the
// newest edit wins. "stale" lists defects that someone changed more recently.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    const input = defectBatch.parse(await readJsonBody(request, 1_500_000))
    const problem = rootLinkProblem(input.defects)
    if (problem) throw new Error(problem)

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const { data, error } = await admin.rpc('app_sync_defects', {
      p_actor_user_id: user.id,
      p_job_id: id,
      p_defects: input.defects.map(normaliseDefect),
    })
    if (error) throw new Error(error.message)
    return Response.json({ ok: true, result: data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return appError(error, 'Unable to save the defects.')
  }
}
