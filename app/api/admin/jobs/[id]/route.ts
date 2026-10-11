import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { sendBookingDateEmail } from '@/lib/booking-notify'
import { JOB_STATUSES } from '@/lib/job-status'
import { readJsonBody } from '@/lib/request-guard'

export const runtime = 'nodejs'


const schema = z
  .object({
    status: z.enum(JOB_STATUSES).optional(),
    staffId: z.union([z.uuid(), z.literal('')]).optional(),
    archived: z.boolean().optional(),
    isTest: z.boolean().optional(),
    internalNotes: z.string().max(4000).optional(),
    confirmedStart: z.union([z.iso.datetime({ offset: true }), z.literal('')]).optional(),
    confirmedEnd: z.union([z.iso.datetime({ offset: true }), z.literal('')]).optional(),
    agentName: z.string().trim().max(120).optional(),
    agentAgency: z.string().trim().max(160).optional(),
    agentPhone: z.string().trim().max(40).regex(/^[0-9+() -]*$/).optional(),
    agentEmail: z.union([z.literal(''), z.email().max(180)]).optional(),
    listingUrl: z.union([z.literal(''), z.string().trim().max(500).regex(/^https?:\/\/\S+$/)]).optional(),
    listingPriceGuide: z.string().trim().max(160).optional(),
    listingChecked: z.boolean().optional(),
    agentTexted: z.literal(true).optional(),
  })
  .strict()

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const input = schema.parse(await readJsonBody(request, 10_000))

    const { data: before } = await supabase
      .from('jobs')
      .select('confirmed_start,payment_status')
      .eq('id', id)
      .maybeSingle()

    const update: Record<string, unknown> = {}
    if (input.status) update.status = input.status
    if (input.archived !== undefined) update.archived_at = input.archived ? new Date().toISOString() : null
    if (input.isTest !== undefined) update.is_test = input.isTest
    if (input.internalNotes !== undefined) update.internal_notes = input.internalNotes.trim() || null
    if (input.confirmedStart !== undefined) update.confirmed_start = input.confirmedStart || null
    if (input.confirmedEnd !== undefined) update.confirmed_end = input.confirmedEnd || null
    if (input.agentName !== undefined) update.agent_name = input.agentName || null
    if (input.agentAgency !== undefined) update.agent_agency = input.agentAgency || null
    if (input.agentPhone !== undefined) update.agent_phone = input.agentPhone || null
    if (input.agentEmail !== undefined) update.agent_email = input.agentEmail || null
    if (input.listingUrl !== undefined) update.listing_url = input.listingUrl || null
    if (input.listingPriceGuide !== undefined) update.listing_price_guide = input.listingPriceGuide || null
    if (input.listingChecked !== undefined) {
      update.listing_checked_at = input.listingChecked ? new Date().toISOString() : null
    }
    if (input.agentTexted) update.agent_texted_at = new Date().toISOString()

    if (Object.keys(update).length > 0) {
      const { error } = await supabase.from('jobs').update(update).eq('id', id)
      if (error) throw new Error(error.message)
    }

    // One inspector per job for now: replace any existing assignment.
    if (input.staffId !== undefined) {
      const { error: clearError } = await supabase.from('job_assignments').delete().eq('job_id', id)
      if (clearError) throw new Error(clearError.message)
      if (input.staffId) {
        const { error } = await supabase
          .from('job_assignments')
          .insert({ job_id: id, staff_id: input.staffId })
        if (error) throw new Error(error.message)
      }
    }

    await supabase.from('audit_events').insert({
      job_id: id,
      event_type: 'admin_job_updated',
      actor_type: 'admin',
      event_data: input,
    })

    // A new or changed booking date is emailed to a paid customer straight
    // away (date only). A change of time on the same day is not re-sent.
    let bookingEmail: 'sent' | 'not_sent' | 'unchanged' = 'unchanged'
    let bookingEmailError = ''
    if (input.confirmedStart && before?.payment_status === 'paid') {
      const day = (iso: string | null) =>
        iso
          ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' }).format(new Date(iso))
          : ''
      if (day(input.confirmedStart) !== day(before.confirmed_start)) {
        try {
          await sendBookingDateEmail(supabase, id)
          bookingEmail = 'sent'
        } catch (error) {
          bookingEmail = 'not_sent'
          bookingEmailError = error instanceof Error ? error.message : 'Email failed.'
        }
      }
    }

    return adminJson({ ok: true, bookingEmail, bookingEmailError })
  } catch (error) {
    return adminError(error, 'Unable to update the job.')
  }
}
