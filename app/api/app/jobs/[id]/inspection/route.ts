import { z } from 'zod'
import { FLOORPLAN_BUCKET } from '@/lib/floorplan'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector, requireVisibleJob } from '@/lib/supabase-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Everything captured on a job: floorplans (with 1-hour image links),
// defects and photo records. ?sinceRev= returns only defects / photos changed
// after that revision; floorplans are always returned in full.
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    await requireVisibleJob(supabase, id)
    const since = new URL(request.url).searchParams.get('sinceRev')
    const sinceRev = since ? z.coerce.number().int().min(0).parse(since) : 0

    const [floorplans, defects, photos] = await Promise.all([
      supabase
        .from('job_floorplans')
        .select('id,level_label,sort_order,content_type,size_bytes,width_px,height_px,source,status,updated_at')
        .eq('job_id', id)
        .eq('status', 'active')
        .order('sort_order'),
      supabase.from('inspection_defects').select('*').eq('job_id', id).gt('sync_rev', sinceRev).order('sync_rev'),
      supabase
        .from('inspection_photos')
        .select('id,defect_id,content_type,size_bytes,sha256,width_px,height_px,caption,source,captured_at,captured_by_staff_id,uploaded_at,deleted_at,sort_order,sync_rev')
        .eq('job_id', id)
        .gt('sync_rev', sinceRev)
        .order('sync_rev'),
    ])
    const failed = floorplans.error || defects.error || photos.error
    if (failed) throw new Error(failed.message)

    // Storage paths are not readable by inspectors; sign them server-side.
    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const ids = (floorplans.data || []).map((row) => row.id)
    const { data: paths } = ids.length
      ? await admin.from('job_floorplans').select('id,storage_path').in('id', ids)
      : { data: [] as { id: string; storage_path: string }[] }
    const pathById = new Map((paths || []).map((row) => [row.id, row.storage_path]))
    const signed = await Promise.all(
      (floorplans.data || []).map(async (row) => {
        const path = pathById.get(row.id)
        const { data } = path
          ? await admin.storage.from(FLOORPLAN_BUCKET).createSignedUrl(path, 3600)
          : { data: null }
        return { ...row, url: data?.signedUrl || null }
      }),
    )

    const rows = [...(defects.data || []), ...(photos.data || [])] as { sync_rev: number }[]
    const serverRev = rows.reduce((max, row) => Math.max(max, Number(row.sync_rev)), sinceRev)

    return Response.json(
      {
        ok: true,
        serverRev,
        floorplans: signed,
        defects: defects.data || [],
        photos: photos.data || [],
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return appError(error, 'Unable to load the inspection.')
  }
}
