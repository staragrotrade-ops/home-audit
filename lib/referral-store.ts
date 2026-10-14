// Server-only. Reads and writes referral partners and builds the statement.
import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  buildReferralStatement,
  codeSuffix,
  melbourneMonthRange,
  normaliseRefCode,
  REFERRAL_COOKIE,
  referrerCodeBase,
  referrerDisplayName,
  type ReferrerRecord,
  type StatementPaidJob,
} from '@/lib/referrals'

export const REFERRER_FIELDS =
  'id,referrer_type,name,agency,branch,mobile,email,ref_code,status,source,notes,commission_type,commission_cents,commission_percent,approved_at,created_at'

/** All referrers, newest first. ready = false before the referrers migration is applied. */
export async function loadReferrers(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('referrers')
    .select(REFERRER_FIELDS)
    .order('created_at', { ascending: false })
  if (error) return { referrers: [] as ReferrerRecord[], ready: false }
  return { referrers: (data || []) as ReferrerRecord[], ready: true }
}

export async function createUniqueReferrerCode(supabase: SupabaseClient, name: string) {
  const base = referrerCodeBase(name)
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const code = `${base}${codeSuffix(randomBytes(3))}`
    const { data, error } = await supabase.from('referrers').select('id').eq('ref_code', code).maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return code
  }
  throw new Error('Could not create a unique referral code. Please try again.')
}

function cookieValue(request: Request, name: string) {
  const header = request.headers.get('cookie') || ''
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return ''
}

/** The referral code saved in the visitor's browser, if it belongs to a current referrer. */
export async function referralCodeFromRequest(request: Request, supabase: SupabaseClient) {
  const code = normaliseRefCode(cookieValue(request, REFERRAL_COOKIE))
  if (!code) return null
  const { data, error } = await supabase
    .from('referrers')
    .select('ref_code,status')
    .eq('ref_code', code)
    .maybeSingle()
  if (error || !data || data.status === 'disabled') return null
  return code
}

async function allRows<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const rows: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await fetchPage(from, from + 999)
    if (error) throw new Error(error.message)
    rows.push(...(data || []))
    if (!data || data.length < 1000) return rows
  }
}

type JobRow = {
  id: string
  public_reference: string
  property_snapshot: Record<string, string | null> | null
  quote_total: number | string | null
  paid_at: string | null
  is_test: boolean
  ref_code: string | null
  referrer_override_id: string | null
  referrer_override_none: boolean
}

export async function loadReferralStatement(supabase: SupabaseClient, month: string, referrers: ReferrerRecord[]) {
  const { start, end } = melbourneMonthRange(month)
  const fields =
    'id,public_reference,property_snapshot,quote_total,paid_at,is_test,ref_code,referrer_override_id,referrer_override_none'

  const paid = await allRows<JobRow>((from, to) =>
    supabase
      .from('jobs')
      .select(fields)
      .eq('payment_status', 'paid')
      .gte('paid_at', start)
      .lt('paid_at', end)
      .order('paid_at')
      .range(from, to),
  )
  const quotes = await allRows<JobRow>((from, to) =>
    supabase
      .from('jobs')
      .select(fields)
      .or('ref_code.not.is.null,referrer_override_id.not.is.null')
      .gte('created_at', start)
      .lt('created_at', end)
      .range(from, to),
  )
  const events = await allRows<{ session_id: string; ref_code: string }>((from, to) =>
    supabase
      .from('analytics_events')
      .select('session_id,ref_code')
      .neq('ref_code', '')
      .gte('created_at', start)
      .lt('created_at', end)
      .range(from, to),
  )
  const sessions = new Map<string, Set<string>>()
  for (const event of events) {
    const set = sessions.get(event.ref_code) || new Set<string>()
    set.add(event.session_id)
    sessions.set(event.ref_code, set)
  }

  const paidJobs: StatementPaidJob[] = paid.map((job) => ({
    jobId: job.id,
    reference: job.public_reference,
    address: [job.property_snapshot?.address, job.property_snapshot?.suburb].filter(Boolean).join(', '),
    paidAt: String(job.paid_at),
    feeInclGstCents: Math.round(Number(job.quote_total || 0) * 100),
    isTest: Boolean(job.is_test),
    ref_code: job.ref_code,
    referrer_override_id: job.referrer_override_id,
    referrer_override_none: job.referrer_override_none,
  }))

  return buildReferralStatement({
    referrers,
    paidJobs,
    quotes: quotes.map((job) => ({
      ref_code: job.ref_code,
      referrer_override_id: job.referrer_override_id,
      referrer_override_none: job.referrer_override_none,
      isTest: job.is_test,
    })),
    visitsByCode: new Map([...sessions].map(([code, set]) => [code, set.size])),
  })
}

/** "Jane Smith (ABC Conveyancing)" when a job has a referrer, for the customer's order page. */
export async function jobReferrerLabel(supabase: SupabaseClient, jobId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('ref_code,referrer_override_id,referrer_override_none')
    .eq('id', jobId)
    .maybeSingle()
  if (error || !data || data.referrer_override_none) return null
  let query = supabase.from('referrers').select('name,agency,branch,status')
  if (data.referrer_override_id) query = query.eq('id', data.referrer_override_id)
  else if (data.ref_code) query = query.eq('ref_code', data.ref_code)
  else return null
  const { data: referrer } = await query.maybeSingle()
  if (!referrer || referrer.status === 'disabled') return null
  return referrerDisplayName(referrer)
}
