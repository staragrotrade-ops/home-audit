import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { FLOORPLAN_BUCKET, FLOORPLAN_MAX_BYTES, fetchListingFloorplan, storeFloorplan } from '@/lib/floorplan'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Params = { params: Promise<{ id: string }> }

// Floorplans on file for a job, with 10-minute preview links.
export async function GET(request: Request, context: Params) {
  const supabase = requireAdmin(request, false)
  if (supabase instanceof Response) return supabase
  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const [{ data: rows, error }, { data: job }] = await Promise.all([
      supabase
        .from('job_floorplans')
        .select('id,level_label,sort_order,storage_path,content_type,size_bytes,source,source_url,created_at')
        .eq('job_id', id)
        .eq('status', 'active')
        .order('sort_order'),
      supabase
        .from('jobs')
        .select('listing_url,floorplan_fetch_status,floorplan_fetch_at,floorplan_fetch_note')
        .eq('id', id)
        .maybeSingle(),
    ])
    if (error) throw new Error(error.message)
    const floorplans = await Promise.all(
      (rows || []).map(async ({ storage_path, ...row }) => {
        const { data } = await supabase.storage.from(FLOORPLAN_BUCKET).createSignedUrl(storage_path, 600)
        return { ...row, url: data?.signedUrl || null }
      }),
    )
    return adminJson({ ok: true, floorplans, fetch: job })
  } catch (error) {
    return adminError(error, 'Unable to load floorplans.')
  }
}

// multipart "file" (+ optional "level") uploads a plan; ?action=fetch tries
// the listing link again.
export async function POST(request: Request, context: Params) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase
  try {
    const { id } = await context.params
    z.uuid().parse(id)
    if (new URL(request.url).searchParams.get('action') === 'fetch') {
      await supabase.from('jobs').update({ floorplan_fetch_status: null }).eq('id', id)
      const result = await fetchListingFloorplan(supabase, id)
      return adminJson({ ok: true, result })
    }
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File) || !file.size) throw new Error('Choose a floorplan file.')
    if (file.size > FLOORPLAN_MAX_BYTES) throw new Error('The floorplan must be under 20 MB.')
    const floorplan = await storeFloorplan(supabase, {
      jobId: id,
      bytes: new Uint8Array(await file.arrayBuffer()),
      source: 'admin',
      levelLabel: String(form.get('level') || ''),
    })
    return adminJson({ ok: true, floorplan }, 201)
  } catch (error) {
    return adminError(error, 'Unable to save the floorplan.')
  }
}

// Removes a plan from the job (kept in storage for the audit trail). Pins
// already placed on it stay on their defects.
export async function DELETE(request: Request, context: Params) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase
  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const floorplanId = z.uuid().parse(new URL(request.url).searchParams.get('floorplanId'))
    const { error } = await supabase
      .from('job_floorplans')
      .update({ status: 'removed' })
      .eq('id', floorplanId)
      .eq('job_id', id)
    if (error) throw new Error(error.message)
    return adminJson({ ok: true })
  } catch (error) {
    return adminError(error, 'Unable to remove the floorplan.')
  }
}
