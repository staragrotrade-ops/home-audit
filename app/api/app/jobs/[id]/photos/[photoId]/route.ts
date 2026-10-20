import { z } from 'zod'
import { PHOTO_BUCKET } from '@/lib/inspection-sync'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector, requireVisibleJob } from '@/lib/supabase-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function load(id: string, photoId: string) {
  const admin = getSupabaseAdmin()
  if (!admin) throw new Error('The app service is not configured.')
  const { data } = await admin
    .from('inspection_photos')
    .select('id,job_id,storage_path,size_bytes,uploaded_at')
    .eq('id', photoId)
    .eq('job_id', id)
    .maybeSingle()
  if (!data) throw new Error('Photo not found.')
  return { admin, photo: data }
}

// A 10-minute download link (for another phone or a reviewer).
export async function GET(request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    const { supabase } = await authenticateInspector(request)
    const { id, photoId } = await context.params
    z.uuid().parse(id)
    z.uuid().parse(photoId)
    await requireVisibleJob(supabase, id)
    const { admin, photo } = await load(id, photoId)
    if (!photo.uploaded_at) throw new Error('This photo has not finished uploading.')
    const { data } = await admin.storage.from(PHOTO_BUCKET).createSignedUrl(photo.storage_path, 600)
    if (!data?.signedUrl) throw new Error('Unable to prepare the download.')
    return Response.json({ ok: true, url: data.signedUrl }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return appError(error, 'Unable to load the photo.')
  }
}

// Step 2 of 2: confirms the upload. The server checks the file is stored and
// has the size the phone reported.
export async function POST(request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    const { supabase } = await authenticateInspector(request)
    const { id, photoId } = await context.params
    z.uuid().parse(id)
    z.uuid().parse(photoId)
    await requireVisibleJob(supabase, id)
    const { admin, photo } = await load(id, photoId)
    if (photo.uploaded_at) return Response.json({ ok: true, uploaded: true })

    const fileName = photo.storage_path.slice(id.length + 1)
    const { data: listed } = await admin.storage.from(PHOTO_BUCKET).list(id, { search: fileName, limit: 1 })
    const stored = listed?.find((item) => item.name === fileName)
    if (!stored) throw new Error('The photo file was not found. Upload it again.')
    const size = Number((stored.metadata as { size?: number } | null)?.size)
    if (Number.isFinite(size) && size !== photo.size_bytes) throw new Error('The uploaded photo size does not match.')

    const { error } = await admin
      .from('inspection_photos')
      .update({ uploaded_at: new Date().toISOString() })
      .eq('id', photoId)
      .is('uploaded_at', null)
    if (error) throw new Error(error.message)
    return Response.json({ ok: true, uploaded: true })
  } catch (error) {
    return appError(error, 'Unable to confirm the photo.')
  }
}

// Removes a photo from the inspection. The file stays in storage for the
// audit trail; the row is marked deleted so every phone drops it on sync.
export async function DELETE(request: Request, context: { params: Promise<{ id: string; photoId: string }> }) {
  try {
    const { supabase, staff } = await authenticateInspector(request)
    const { id, photoId } = await context.params
    z.uuid().parse(id)
    z.uuid().parse(photoId)
    await requireVisibleJob(supabase, id)
    const { admin } = await load(id, photoId)
    const { error } = await admin
      .from('inspection_photos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', photoId)
      .eq('job_id', id)
      .is('deleted_at', null)
    if (error) throw new Error(error.message)
    await admin.from('audit_events').insert({
      job_id: id,
      event_type: 'app_photo_deleted',
      actor_type: 'staff',
      actor_id: staff.id,
      event_data: { photo_id: photoId },
    })
    return Response.json({ ok: true })
  } catch (error) {
    return appError(error, 'Unable to remove the photo.')
  }
}
