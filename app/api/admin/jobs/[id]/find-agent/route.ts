import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { audit, jobAddress, loadJobContact } from '@/lib/admin-jobs'
import { lookUpSellingAgent } from '@/lib/agent-lookup'

export const runtime = 'nodejs'
export const maxDuration = 60

// Looks up the selling agent with Google AI. Nothing is saved: the dashboard
// fills the form and the owner checks it before pressing Save.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const job = await loadJobContact(supabase, id)
    const address = jobAddress(job)
    if (!address) throw new Error('This job has no property address.')

    const result = await lookUpSellingAgent(address)
    await audit(supabase, id, 'agent_lookup', {
      found: Boolean(result.agentName || result.mobile),
      confidence: result.confidence,
    })
    return adminJson({ ok: true, result })
  } catch (error) {
    return adminError(error, 'The agent lookup did not work.')
  }
}
