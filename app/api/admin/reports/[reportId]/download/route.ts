import { z } from 'zod'
import { adminError, requireAdmin } from '@/lib/admin-api'
import { REPORT_BUCKET } from '@/lib/reports'

export const runtime = 'nodejs'

// Opens an issued report through a short-lived signed link.
export async function GET(request: Request, context: { params: Promise<{ reportId: string }> }) {
  const supabase = requireAdmin(request, false)
  if (supabase instanceof Response) return supabase

  try {
    const { reportId } = await context.params
    z.uuid().parse(reportId)
    const { data: report, error } = await supabase
      .from('inspection_reports')
      .select('storage_path')
      .eq('id', reportId)
      .maybeSingle()
    if (error || !report) throw new Error('Report not found.')

    const { data, error: signError } = await supabase.storage
      .from(REPORT_BUCKET)
      .createSignedUrl(report.storage_path, 300)
    if (signError || !data) throw new Error('Unable to open the report.')
    return Response.redirect(data.signedUrl, 303)
  } catch (error) {
    return adminError(error, 'Unable to open the report.')
  }
}
