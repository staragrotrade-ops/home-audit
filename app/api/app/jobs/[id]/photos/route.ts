import { z } from 'zod'
import { PHOTO_BUCKET, photoInput, photoPath } from '@/lib/inspection-sync'
import { readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'

// Step 1 of 2: records the photo (idempotent by the phone's id) and returns a
// one-off upload link. If the photo is already uploaded, no link is returned.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    const photo = photoInput.parse(await readJsonBody(request, 4_000))
    const path = photoPath(id, photo.id, photo.contentType)

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const { data, error } = await admin.rpc('app_register_photo', {
      p_actor_user_id: user.id,
      p_job_id: id,
      p_photo: { ...photo, sha256: photo.sha256.toLowerCase() },
      p_storage_path: path,
    })
    if (error) throw new Error(error.message)
    const registered = data as { id: string; storagePath: string; uploaded: boolean }
    if (registered.uploaded) return Response.json({ ok: true, uploaded: true })

    const { data: upload, error: uploadError } = await admin.storage
      .from(PHOTO_BUCKET)
      .createSignedUploadUrl(registered.storagePath, { upsert: true })
    if (uploadError || !upload) throw new Error('Unable to prepare the photo upload.')
    return Response.json({
      ok: true,
      uploaded: false,
      signedUrl: upload.signedUrl,
      token: upload.token,
      path: registered.storagePath,
      contentType: photo.contentType,
    })
  } catch (error) {
    return appError(error, 'Unable to register the photo.')
  }
}
