import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { sendReportToCustomer } from '@/lib/report-delivery'

export const runtime = 'nodejs'

// Emails the customer a link to download the current report.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const result = await sendReportToCustomer(supabase, id, null)
    return adminJson({ ok: true, ...result })
  } catch (error) {
    return adminError(error, 'Unable to send the report.')
  }
}
