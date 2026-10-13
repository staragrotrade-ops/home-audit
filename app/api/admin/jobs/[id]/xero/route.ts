import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { audit } from '@/lib/admin-jobs'
import { createPaidXeroInvoice } from '@/lib/xero'

export const runtime = 'nodejs'
export const maxDuration = 60

// Creates the paid Xero invoice for a job now (or finishes a failed attempt).
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    let record: Record<string, unknown>
    try {
      record = await createPaidXeroInvoice(supabase, id)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Xero sync failed.'
      await supabase
        .from('xero_records')
        .upsert({ job_id: id, last_error: message.slice(0, 1000), updated_at: new Date().toISOString() }, { onConflict: 'job_id' })
      throw error
    }
    await audit(supabase, id, 'xero_invoice_synced', { invoice: record.invoice_number || record.invoice_id })
    return adminJson({ ok: true, invoiceNumber: record.invoice_number || null })
  } catch (error) {
    return adminError(error, 'Unable to send the job to Xero.')
  }
}
