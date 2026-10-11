import { z } from 'zod'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    const { data, error } = await supabase
      .from('inspection_reports')
      .select('id,report_kind,version_label,size_bytes,sha256,status,issued_at')
      .eq('job_id', id)
      .order('issued_at', { ascending: false })
    if (error) throw new Error(error.message)
    return Response.json({ ok: true, reports: data || [] }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return appError(error, 'Unable to load reports.')
  }
}
