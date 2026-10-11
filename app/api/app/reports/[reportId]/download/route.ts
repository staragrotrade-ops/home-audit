import { z } from 'zod'
import { REPORT_BUCKET } from '@/lib/reports'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Returns a five-minute signed link to an issued report the inspector can see.
export async function GET(request: Request, context: { params: Promise<{ reportId: string }> }) {
  try {
    const { supabase } = await authenticateInspector(request)
    const { reportId } = await context.params
    z.uuid().parse(reportId)

    // RLS confirms the report belongs to one of this inspector's jobs.
    const { data: visible, error: visibleError } = await supabase
      .from('inspection_reports')
      .select('id')
      .eq('id', reportId)
      .maybeSingle()
    if (visibleError || !visible) throw new Error('Report not found.')

    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const { data: report } = await admin
      .from('inspection_reports')
      .select('storage_path,size_bytes,sha256')
      .eq('id', reportId)
      .single()
    if (!report) throw new Error('Report not found.')
    const { data, error } = await admin.storage.from(REPORT_BUCKET).createSignedUrl(report.storage_path, 300)
    if (error || !data) throw new Error('Unable to open the report.')

    return Response.json(
      { ok: true, url: data.signedUrl, sizeBytes: report.size_bytes, sha256: report.sha256 },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return appError(error, 'Unable to open the report.')
  }
}
