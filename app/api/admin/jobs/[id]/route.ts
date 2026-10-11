import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
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
  })
  .strict()

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const input = schema.parse(await readJsonBody(request, 10_000))

    const update: Record<string, unknown> = {}
    if (input.status) update.status = input.status
    if (input.archived !== undefined) update.archived_at = input.archived ? new Date().toISOString() : null
    if (input.isTest !== undefined) update.is_test = input.isTest
    if (input.internalNotes !== undefined) update.internal_notes = input.internalNotes.trim() || null
    if (input.confirmedStart !== undefined) update.confirmed_start = input.confirmedStart || null
    if (input.confirmedEnd !== undefined) update.confirmed_end = input.confirmedEnd || null

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

    return adminJson({ ok: true })
  } catch (error) {
    return adminError(error, 'Unable to update the job.')
  }
}
