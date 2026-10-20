import { z } from 'zod'
import { FLOORPLAN_BUCKET, imageSize, sniffImageType } from '@/lib/floorplan'
import { readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector, requireVisibleJob } from '@/lib/supabase-user'

export const runtime = 'nodejs'
export const maxDuration = 30

const schema = z.object({
  path: z.string().min(40).max(200),
  levelLabel: z.string().trim().min(1).max(60),
})

// Step 2 of 2: the server reads the stored file, checks it really is an image
// or PDF, and records it as a floorplan of this job.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase, staff } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    await requireVisibleJob(supabase, id)
    const input = schema.parse(await readJsonBody(request, 1_000))
    if (!new RegExp(`^${id}/onsite-\\d{13}-[0-9a-f-]{36}\\.(jpg|png|webp|pdf)$`).test(input.path)) {
      throw new Error('The floorplan path does not belong to this job.')
    }

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const { data: blob, error } = await admin.storage.from(FLOORPLAN_BUCKET).download(input.path)
    if (error || !blob) throw new Error('The uploaded floorplan was not found.')
    const bytes = new Uint8Array(await blob.arrayBuffer())
    const type = sniffImageType(bytes)
    if (!type) {
      await admin.storage.from(FLOORPLAN_BUCKET).remove([input.path])
      throw new Error('That file is not a JPG, PNG, WebP or PDF.')
    }

    const { count } = await admin
      .from('job_floorplans')
      .select('id', { count: 'exact', head: true })
      .eq('job_id', id)
      .eq('status', 'active')
    const size = imageSize(bytes, type)
    const { data, error: insertError } = await admin
      .from('job_floorplans')
      .upsert(
        {
          job_id: id,
          level_label: input.levelLabel,
          sort_order: count || 0,
          storage_path: input.path,
          content_type: type,
          size_bytes: bytes.byteLength,
          width_px: size?.width ?? null,
          height_px: size?.height ?? null,
          source: 'onsite',
          uploaded_by_staff_id: staff.id,
        },
        { onConflict: 'storage_path' },
      )
      .select('id,level_label,content_type,width_px,height_px,source')
      .single()
    if (insertError || !data) throw new Error('Unable to record the floorplan.')
    return Response.json({ ok: true, floorplan: data }, { status: 201 })
  } catch (error) {
    return appError(error, 'Unable to save the floorplan.')
  }
}
