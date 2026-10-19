import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jobIdForToken } from '@/lib/access-tokens'
import { recordAgreement } from '@/lib/agreement-store'
import { AGREEMENT_VERSION } from '@/lib/inspection-agreement'
import { loadOrder } from '@/lib/orders'
import { isSameOriginMutation, readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const schema = z.object({ agreed: z.literal(true), version: z.string().max(20) })

// The customer ticked "I have read and agree to the Inspection Agreement".
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!isSameOriginMutation(request)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  }
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Unavailable.' }, { status: 503 })

  try {
    const { token } = await context.params
    const jobId = await jobIdForToken(supabase, token)
    const job = jobId ? await loadOrder(supabase, jobId) : null
    if (!job) return NextResponse.json({ error: 'This link has expired.' }, { status: 404 })
    if (job.status === 'cancelled') {
      return NextResponse.json({ error: 'This order has been cancelled.' }, { status: 409 })
    }

    const parsed = schema.safeParse(await readJsonBody(request, 1_000))
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please tick the box to accept the agreement.' }, { status: 400 })
    }
    if (parsed.data.version !== AGREEMENT_VERSION) {
      return NextResponse.json(
        { error: 'The agreement has been updated. Please refresh the page and read it again.' },
        { status: 409 },
      )
    }

    const status = await recordAgreement(supabase, job.id)
    return NextResponse.json({ ok: true, version: status.version, acceptedAt: status.acceptedAt })
  } catch (error) {
    console.error('agreement_failed', { message: error instanceof Error ? error.message : 'unknown' })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'The agreement could not be saved.' },
      { status: 400 },
    )
  }
}
