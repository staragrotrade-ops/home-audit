import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { REPORT_BUCKET, REPORT_KINDS, REPORT_MAX_BYTES } from '@/lib/reports'
import { readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'

const schema = z.object({
  reportKind: z.enum(REPORT_KINDS),
  sizeBytes: z.number().int().positive().max(REPORT_MAX_BYTES),
})

// Step 1 of 2: returns a one-off signed URL. The app uploads the PDF straight
// to private storage with it, then calls report-complete.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    const input = schema.parse(await readJsonBody(request, 2_000))

    // Reading through the inspector's own client proves the job is theirs.
    const { data: visible, error: visibleError } = await supabase
      .from('inspector_job_feed')
      .select('id,public_reference')
      .eq('id', id)
      .maybeSingle()
    if (visibleError || !visible) throw new Error('Job not found or not assigned to this inspector.')

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const path = `${id}/${input.reportKind}-${Date.now()}-${randomUUID()}.pdf`
    const { data, error } = await admin.storage.from(REPORT_BUCKET).createSignedUploadUrl(path)
    if (error || !data) throw new Error('Unable to prepare the upload.')

    return Response.json({
      ok: true,
      bucket: REPORT_BUCKET,
      path,
      signedUrl: data.signedUrl,
      token: data.token,
      contentType: 'application/pdf',
      maxBytes: REPORT_MAX_BYTES,
    })
  } catch (error) {
    return appError(error, 'Unable to prepare the upload.')
  }
}
