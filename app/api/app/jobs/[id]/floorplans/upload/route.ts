import { z } from 'zod'
import { FLOORPLAN_BUCKET, FLOORPLAN_MAX_BYTES, FLOORPLAN_TYPES, floorplanPath } from '@/lib/floorplan'
import { readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector, requireVisibleJob } from '@/lib/supabase-user'

export const runtime = 'nodejs'

const schema = z.object({
  contentType: z.enum(FLOORPLAN_TYPES),
  sizeBytes: z.number().int().positive().max(FLOORPLAN_MAX_BYTES),
})

// Step 1 of 2 for a floorplan photographed or drawn onsite.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    await requireVisibleJob(supabase, id)
    const input = schema.parse(await readJsonBody(request, 1_000))

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const path = floorplanPath(id, 'onsite', input.contentType)
    const { data, error } = await admin.storage.from(FLOORPLAN_BUCKET).createSignedUploadUrl(path)
    if (error || !data) throw new Error('Unable to prepare the upload.')
    return Response.json({ ok: true, path, signedUrl: data.signedUrl, token: data.token })
  } catch (error) {
    return appError(error, 'Unable to prepare the floorplan upload.')
  }
}
