import { z } from 'zod'
import { sendReportToCustomer } from '@/lib/report-delivery'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'

// The app's "Send to customer": only an assigned inspector who may issue
// reports. Emails the customer a link to download the current report.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    const admin = getSupabaseAdmin()
    if (!admin) throw new Error('The app service is not configured.')
    const { data: staffId, error } = await admin.rpc('app_report_sender', {
      p_actor_user_id: user.id,
      p_job_id: id,
    })
    if (error) throw new Error(error.message)
    const result = await sendReportToCustomer(admin, id, staffId as string)
    return Response.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return appError(error, 'Unable to send the report.')
  }
}
