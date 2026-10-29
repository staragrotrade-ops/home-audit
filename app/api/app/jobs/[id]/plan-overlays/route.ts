import { z } from 'zod'
import { planOverlayBatch } from '@/lib/inspection-sync'
import { readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'

// Uploads floor overlays (an upper floorplan aligned onto the floor below,
// its wet areas, moisture readings). Keyed by the phone's id; newest edit
// wins; stale ones are reported.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    const input = planOverlayBatch.parse(await readJsonBody(request, 500_000))
    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const { data, error } = await admin.rpc('app_sync_plan_overlays', {
      p_actor_user_id: user.id,
      p_job_id: id,
      p_overlays: input.overlays,
    })
    if (error) throw new Error(error.message)
    return Response.json({ ok: true, result: data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return appError(error, 'Unable to save the floor overlay.')
  }
}
