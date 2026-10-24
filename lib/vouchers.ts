// Server-only. Issuing, claiming and redeeming Building & Pest vouchers.
import { timingSafeEqual } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  checkVoucher,
  generateVoucherCode,
  normalizeVoucherCode,
  VOUCHER_AMOUNT_CENTS,
  VOUCHER_REASON_TEXT,
  voucherExpiry,
  type VoucherRow,
} from '@/lib/voucher-rules'

const VOUCHER_COLUMNS = 'code,amount_cents,expires_at,claimed_job_id,redeemed_at,cancelled_at'

/** True when the request carries the shared secret the 137B website uses. */
export function isVoucherIssuer(request: Request) {
  const secret = process.env.VOUCHER_ISSUE_SECRET || ''
  const given = request.headers.get('x-voucher-secret') || ''
  if (secret.length < 32 || given.length !== secret.length) return false
  return timingSafeEqual(Buffer.from(given), Buffer.from(secret))
}

/**
 * The voucher for a 137B job. Issuing again for the same job returns the
 * code already issued, so a retry never creates a second voucher.
 */
export async function issueVoucher(
  supabase: SupabaseClient,
  input: { sourceReference: string; email: string | null },
) {
  const { data: existing, error: existingError } = await supabase
    .from('vouchers')
    .select('code,amount_cents,expires_at')
    .eq('source', '137b')
    .eq('source_reference', input.sourceReference)
    .maybeSingle()
  if (existingError) throw new Error(existingError.message)
  if (existing) return { ...existing, created: false }

  const now = new Date()
  for (let attempt = 0; attempt < 5; attempt++) {
    const row = {
      code: generateVoucherCode(),
      amount_cents: VOUCHER_AMOUNT_CENTS,
      expires_at: voucherExpiry(now).toISOString(),
      source: '137b',
      source_reference: input.sourceReference,
      issued_to_email: input.email,
    }
    const { error } = await supabase.from('vouchers').insert(row)
    if (!error) return { code: row.code, amount_cents: row.amount_cents, expires_at: row.expires_at, created: true }
    // 23505: a code clash (retry) or a parallel issue for the same job.
    if (error.code !== '23505') throw new Error(error.message)
    const { data: raced } = await supabase
      .from('vouchers')
      .select('code,amount_cents,expires_at')
      .eq('source', '137b')
      .eq('source_reference', input.sourceReference)
      .maybeSingle()
    if (raced) return { ...raced, created: false }
  }
  throw new Error('Could not create a unique voucher code.')
}

export type VoucherClaim =
  | { applied: true; code: string; amountCents: number }
  | { applied: false; code: string; note: string }
  | null

/**
 * Ties the code the customer entered to their quote. Returns null when no
 * code was entered, and a note for the owner when the code cannot be used.
 */
export async function claimVoucherForJob(
  supabase: SupabaseClient,
  jobId: string,
  rawCode: string,
): Promise<VoucherClaim> {
  if (!rawCode.trim()) return null
  const code = normalizeVoucherCode(rawCode)
  if (!code) return { applied: false, code: rawCode.trim().slice(0, 32), note: `Voucher code "${rawCode.trim().slice(0, 32)}" not recognised.` }

  const { data, error } = await supabase.from('vouchers').select(VOUCHER_COLUMNS).eq('code', code).maybeSingle()
  if (error) throw new Error(error.message)
  const check = checkVoucher((data as VoucherRow | null) || null, jobId)
  if (!check.ok) return { applied: false, code, note: `Voucher ${code} ${VOUCHER_REASON_TEXT[check.reason]}; no discount applied.` }

  // Claim only if still unclaimed, so two quotes cannot use the same code.
  const { data: claimed, error: claimError } = await supabase
    .from('vouchers')
    .update({ claimed_job_id: jobId, claimed_at: new Date().toISOString() })
    .eq('code', code)
    .is('claimed_job_id', null)
    .is('redeemed_at', null)
    .is('cancelled_at', null)
    .select('code')
    .maybeSingle()
  if (claimError && claimError.code !== '23505') throw new Error(claimError.message)
  if (!claimed && (data as VoucherRow).claimed_job_id !== jobId) {
    return { applied: false, code, note: `Voucher ${code} already used; no discount applied.` }
  }

  const { error: jobError } = await supabase
    .from('jobs')
    .update({ voucher_code: code, voucher_discount_cents: check.amountCents })
    .eq('id', jobId)
  if (jobError) throw new Error(jobError.message)
  return { applied: true, code, amountCents: check.amountCents }
}

/** The voucher discount recorded on a job, or 0. */
export async function jobVoucherCents(supabase: SupabaseClient, jobId: string) {
  const { data } = await supabase.from('jobs').select('voucher_discount_cents').eq('id', jobId).maybeSingle()
  return Math.max(0, Number(data?.voucher_discount_cents || 0))
}

/** Marks the job's voucher used once the order is paid. Safe to repeat. */
export async function redeemJobVoucher(supabase: SupabaseClient, jobId: string) {
  const { error } = await supabase
    .from('vouchers')
    .update({ redeemed_at: new Date().toISOString() })
    .eq('claimed_job_id', jobId)
    .is('redeemed_at', null)
  if (error) console.error('voucher_redeem_failed', { code: error.code })
}
