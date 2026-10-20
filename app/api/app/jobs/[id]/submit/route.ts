import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'

// The field inspector hands the job to a reviewer. Refused while any photo is
// still uploading, so the reviewer never sees a partial set.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const { data, error } = await admin.rpc('app_submit_fieldwork', { p_actor_user_id: user.id, p_job_id: id })
    if (error) throw new Error(error.message)
    return Response.json({ ok: true, progress: data })
  } catch (error) {
    return appError(error, 'Unable to submit the fieldwork.')
  }
}
