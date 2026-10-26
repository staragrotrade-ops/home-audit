import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { qrPng } from '@/lib/qr'
import { transferLinkFor, transferUrl } from '@/lib/report-transfer'

export const runtime = 'nodejs'

// The QR code / link to give the agent: other buyers can buy the report.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase
  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const { count } = await supabase
      .from('inspection_reports')
      .select('id', { count: 'exact', head: true })
      .eq('job_id', id)
      .eq('status', 'issued')
      .not('template_path', 'is', null)
    if (!count) throw new Error('Issue the report from the app (version 0.7 or later) first.')
    const code = await transferLinkFor(supabase, id)
    const url = transferUrl(code)
    const png = qrPng(url, 10, 4)
    return adminJson({ ok: true, url, qr: `data:image/png;base64,${Buffer.from(png).toString('base64')}` })
  } catch (error) {
    return adminError(error, 'Unable to create the transfer link.')
  }
}
