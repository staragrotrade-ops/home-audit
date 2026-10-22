import { z } from 'zod'
import { areaBatch } from '@/lib/inspection-sync'
import { readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'

// Uploads the areas (rooms) checklist edited on the phone. Same rules as
// defects: keyed by the phone's id, newest edit wins, stale ones reported.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    const input = areaBatch.parse(await readJsonBody(request, 500_000))
    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const { data, error } = await admin.rpc('app_sync_areas', {
      p_actor_user_id: user.id,
      p_job_id: id,
      p_areas: input.areas,
    })
    if (error) throw new Error(error.message)
    return Response.json({ ok: true, result: data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return appError(error, 'Unable to save the areas.')
  }
}
