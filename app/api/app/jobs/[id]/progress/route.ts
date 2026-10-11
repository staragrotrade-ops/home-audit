import { z } from 'zod'
import { readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'

const schema = z
  .object({
    inspectionStatus: z.enum(['not_started', 'on_site', 'inspected']).optional(),
    reportStatus: z.enum(['not_started', 'drafting']).optional(),
  })
  .strict()
  .refine((value) => value.inspectionStatus || value.reportStatus, 'Nothing to update.')

// Moves inspection / report progress forward. "issued" is set only when a
// report PDF is registered.
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    const input = schema.parse(await readJsonBody(request, 2_000))

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const { data, error } = await admin.rpc('app_update_job_progress', {
      p_actor_user_id: user.id,
      p_job_id: id,
      p_inspection_status: input.inspectionStatus || null,
      p_report_status: input.reportStatus || null,
    })
    if (error) throw new Error(error.message)
    return Response.json({ ok: true, progress: data })
  } catch (error) {
    return appError(error, 'Unable to update progress.')
  }
}
