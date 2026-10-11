import { z } from 'zod'
import { REPORT_BUCKET, REPORT_KINDS, REPORT_MAX_BYTES } from '@/lib/reports'
import { readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'

const schema = z.object({
  reportKind: z.enum(REPORT_KINDS),
  versionLabel: z.string().regex(/^v[1-9][0-9]*$/),
  storagePath: z.string().min(40).max(300),
  sizeBytes: z.number().int().positive().max(REPORT_MAX_BYTES),
  sha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
  issuedAt: z.iso.datetime({ offset: true }).optional(),
})

// Step 2 of 2: registers the uploaded PDF as an issued report.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    const input = schema.parse(await readJsonBody(request, 4_000))
    // Only the exact path handed out by report-upload for this job and kind.
    const fileName = input.storagePath.slice(id.length + 1)
    const expected = new RegExp(
      `^${input.reportKind}-\\d{13}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.pdf$`,
    )
    if (!input.storagePath.startsWith(`${id}/`) || !expected.test(fileName)) {
      throw new Error('The report path does not belong to this job.')
    }

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')

    // Check the stored file is really there and has the size the app reported.
    const { data: listed, error: listError } = await admin.storage
      .from(REPORT_BUCKET)
      .list(id, { search: fileName, limit: 1 })
    const stored = listed?.find((item) => item.name === fileName)
    if (listError || !stored) throw new Error('The uploaded PDF was not found.')
    const storedSize = Number((stored.metadata as { size?: number } | null)?.size)
    if (Number.isFinite(storedSize) && storedSize !== input.sizeBytes) {
      throw new Error('The uploaded PDF size does not match.')
    }

    const { data, error } = await admin.rpc('register_inspection_report', {
      p_actor_user_id: user.id,
      p_job_id: id,
      p_report_kind: input.reportKind,
      p_version_label: input.versionLabel,
      p_storage_path: input.storagePath,
      p_size_bytes: input.sizeBytes,
      p_sha256: input.sha256.toLowerCase(),
      p_issued_at: input.issuedAt || new Date().toISOString(),
    })
    if (error) throw new Error(error.message)
    return Response.json({ ok: true, report: data }, { status: 201 })
  } catch (error) {
    return appError(error, 'Unable to register the report.')
  }
}
