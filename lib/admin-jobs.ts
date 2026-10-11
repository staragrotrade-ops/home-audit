// Server-only. Loads the fields admin actions need for one job.
import type { SupabaseClient } from '@supabase/supabase-js'

export type AdminJobContact = {
  id: string
  public_reference: string
  status: string
  payment_status: string
  quote_status: string
  confirmed_start: string | null
  customer_snapshot: Record<string, string | null>
  property_snapshot: Record<string, string | null>
}

export async function loadJobContact(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('id,public_reference,status,payment_status,quote_status,confirmed_start,customer_snapshot,property_snapshot')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) throw new Error('Job not found.')
  return data as AdminJobContact
}

export function jobAddress(job: AdminJobContact) {
  const property = job.property_snapshot || {}
  return [property.address, property.suburb, property.postcode].filter(Boolean).join(', ')
}

export async function audit(
  supabase: SupabaseClient,
  jobId: string,
  eventType: string,
  eventData: Record<string, unknown> = {},
) {
  await supabase.from('audit_events').insert({
    job_id: jobId,
    event_type: eventType,
    actor_type: 'admin',
    event_data: eventData,
  })
}
