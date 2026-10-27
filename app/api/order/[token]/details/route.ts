import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jobIdForToken } from '@/lib/access-tokens'
import { loadAgreementStatus } from '@/lib/agreement-store'
import { ACCESS_CHOICES, BUYER_SITUATIONS } from '@/lib/booking-options'
import { syncJobCalendar } from '@/lib/google-calendar'
import { loadOrder } from '@/lib/orders'
import { isSameOriginMutation, readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const phone = z.string().trim().max(40).regex(/^[0-9+() -]*$/, 'Use digits, spaces and + only.')

const schema = z
  .object({
    buyerSituation: z.enum(BUYER_SITUATIONS.map(([value]) => value) as [string, ...string[]]),
    accessChoice: z.enum(ACCESS_CHOICES.map(([value]) => value) as [string, ...string[]]),
    otherName: z.string().trim().max(120).default(''),
    otherPhone: phone.default(''),
    agentName: z.string().trim().max(120).default(''),
    agentPhone: phone.default(''),
    agentEmail: z.union([z.literal(''), z.email().max(180)]).default(''),
    notes: z.string().trim().max(1000).default(''),
  })
  .superRefine((value, context) => {
    if (value.accessChoice === 'other' && (!value.otherName || value.otherPhone.length < 8)) {
      context.addIssue({
        code: 'custom',
        path: ['otherPhone'],
        message: 'Enter the name and phone number of the person to contact.',
      })
    }
  })

// After payment: the buyer's situation and who to contact for access.
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
    if (job.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment has not been received yet.' }, { status: 409 })
    }
    if (!(await loadAgreementStatus(supabase, job.id)).accepted) {
      return NextResponse.json(
        { error: 'Please read and accept the Inspection Agreement first.' },
        { status: 409 },
      )
    }

    const parsed = schema.safeParse(await readJsonBody(request, 5_000))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Please check the details.' },
        { status: 400 },
      )
    }
    const input = parsed.data

    const update: Record<string, unknown> = {
      buyer_situation: input.buyerSituation,
      access_choice: input.accessChoice,
      access_other_name: input.accessChoice === 'other' ? input.otherName : null,
      access_other_phone: input.accessChoice === 'other' ? input.otherPhone : null,
      details_submitted_at: new Date().toISOString(),
    }
    // Agent details from the customer fill empty fields only; what is already
    // saved (the quote form or the owner's dashboard entries) is kept. A
    // different value from the customer is added to the notes instead.
    const changed: string[] = []
    const agentFields = [
      ['agent_name', 'name', input.agentName, job.agent_name],
      ['agent_phone', 'phone', input.agentPhone, job.agent_phone],
      ['agent_email', 'email', input.agentEmail, job.agent_email],
    ] as const
    for (const [column, label, given, saved] of agentFields) {
      if (!given) continue
      if (!saved) update[column] = given
      else if (given.toLowerCase() !== saved.toLowerCase()) changed.push(`${label} ${given}`)
    }
    const notes = [input.notes, changed.length ? `Customer's agent details: ${changed.join(', ')}` : '']
      .filter(Boolean)
      .join('\n')
    if (notes) update.access_notes = notes

    const { error } = await supabase.from('jobs').update(update).eq('id', job.id)
    if (error) throw new Error(error.message)
    await supabase.from('audit_events').insert({
      job_id: job.id,
      event_type: 'customer_booking_details',
      actor_type: 'customer',
      event_data: { buyer_situation: input.buyerSituation, access_choice: input.accessChoice },
    })
    // A booked job's calendar event shows the access details.
    if (job.confirmed_start) await syncJobCalendar(supabase, job.id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('order_details_failed', { message: error instanceof Error ? error.message : 'unknown' })
    return NextResponse.json({ error: 'The details could not be saved.' }, { status: 400 })
  }
}
