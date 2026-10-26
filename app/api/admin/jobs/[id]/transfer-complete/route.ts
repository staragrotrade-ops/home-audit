import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { completeTransfer } from '@/lib/report-transfer'

export const runtime = 'nodejs'
export const maxDuration = 60

// Retries issuing a paid transfer (if the automatic step failed).
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase
  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const outcome = await completeTransfer(supabase, id)
    if (outcome === 'skipped') throw new Error('This order is not a paid report transfer.')
    return adminJson({ ok: true, outcome })
  } catch (error) {
    return adminError(error, 'Unable to issue the transfer.')
  }
}
