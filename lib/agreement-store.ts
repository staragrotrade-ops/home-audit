// Server-only. Records and reads the customer's acceptance of the Inspection
// Agreement. Read separately from the order so a missing migration cannot
// break the order page or the admin dashboard.
import { createHash } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AGREEMENT_VERSION, agreementPlainText } from '@/lib/inspection-agreement'

export type AgreementStatus = {
  /** false until the inspection agreement migration is applied. */
  ready: boolean
  version: string | null
  acceptedAt: string | null
  /** The customer accepted the current version, or an earlier one for this job. */
  accepted: boolean
}

export function agreementSha256() {
  return createHash('sha256').update(agreementPlainText(), 'utf8').digest('hex')
}

export async function loadAgreementStatus(supabase: SupabaseClient, jobId: string): Promise<AgreementStatus> {
  const { data, error } = await supabase
    .from('jobs')
    .select('agreement_version,agreement_accepted_at')
    .eq('id', jobId)
    .maybeSingle()
  if (error || !data) return { ready: !error, version: null, acceptedAt: null, accepted: false }
  const version = (data.agreement_version as string | null) || null
  const acceptedAt = (data.agreement_accepted_at as string | null) || null
  return { ready: true, version, acceptedAt, accepted: Boolean(version && acceptedAt) }
}

/** Agreement status for many jobs (admin list). Empty map before the migration. */
export async function loadAgreementStatuses(supabase: SupabaseClient, jobIds: string[]) {
  const statuses = new Map<string, { version: string; acceptedAt: string }>()
  if (!jobIds.length) return { ready: true, statuses }
  const { data, error } = await supabase
    .from('jobs')
    .select('id,agreement_version,agreement_accepted_at')
    .in('id', jobIds)
    .not('agreement_accepted_at', 'is', null)
  if (error) return { ready: false, statuses }
  for (const row of data || []) {
    statuses.set(row.id as string, {
      version: row.agreement_version as string,
      acceptedAt: row.agreement_accepted_at as string,
    })
  }
  return { ready: true, statuses }
}

// Records acceptance of the current version. A repeat tick keeps the first
// acceptance of the same version. A job that already accepted keeps that
// version: the agreement in force for a booking does not change under it.
export async function recordAgreement(supabase: SupabaseClient, jobId: string) {
  const current = await loadAgreementStatus(supabase, jobId)
  if (!current.ready) {
    throw new Error('The agreement could not be saved. Please try again later or contact us.')
  }
  if (current.accepted) return current

  const acceptedAt = new Date().toISOString()
  const sha256 = agreementSha256()
  const { data, error } = await supabase
    .from('jobs')
    .update({ agreement_version: AGREEMENT_VERSION, agreement_sha256: sha256, agreement_accepted_at: acceptedAt })
    .eq('id', jobId)
    .is('agreement_accepted_at', null)
    .select('id')
  if (error) throw new Error('The agreement could not be saved. Please try again.')
  if (data?.length) {
    await supabase.from('audit_events').insert({
      job_id: jobId,
      event_type: 'agreement_accepted',
      actor_type: 'customer',
      event_data: { version: AGREEMENT_VERSION, sha256 },
    })
  }
  return loadAgreementStatus(supabase, jobId)
}
