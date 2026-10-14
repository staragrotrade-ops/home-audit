import { NextResponse } from 'next/server'
import { z } from 'zod'
import { markTest, ownerEmail, sendEmail } from '@/lib/email'
import { createUniqueReferrerCode } from '@/lib/referral-store'
import { REFERRER_TYPES, referrerTypeLabel } from '@/lib/referrals'
import { clientHash, globalHash, isSameOriginMutation, readJsonBody } from '@/lib/request-guard'
import { isExcludedRequest } from '@/lib/analytics-exclusion'
import { SITE_URL } from '@/lib/site'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { turnstileConfigured, verifyTurnstile } from '@/lib/turnstile'

export const runtime = 'nodejs'

const types = REFERRER_TYPES.map(([value]) => value) as [string, ...string[]]

const schema = z
  .object({
    referrerType: z.enum(types),
    name: z.string().trim().min(2, 'Enter your name.').max(120),
    agency: z.string().trim().max(160).default(''),
    branch: z.string().trim().max(160).default(''),
    mobile: z.string().trim().min(8, 'Enter your mobile number.').max(30).regex(/^[0-9+() -]+$/, 'Use digits, spaces and + in the mobile number.'),
    email: z.email('Check your email address.').max(180),
    notes: z.string().trim().max(1000).default(''),
    agree: z.literal(true, 'Please confirm the details are correct.'),
    turnstileToken: z.string().max(4000).default(''),
    website: z.string().max(0).default(''),
  })
  .strict()

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

// Self-registration from /partners/register. The referrer starts as
// "pending": their link is recorded straight away, and the owner approves
// them (and sets any commission) in the dashboard.
export async function POST(request: Request) {
  if (!isSameOriginMutation(request)) return reply({ error: 'Invalid request.' }, 403)
  const supabase = getSupabaseAdmin()
  if (!supabase) return reply({ error: 'Registration is not available right now.' }, 503)

  const parsed = schema.safeParse(await readJsonBody(request, 6_000).catch(() => null))
  if (!parsed.success) return reply({ error: parsed.error.issues[0]?.message || 'Please check the form.' }, 400)
  const input = parsed.data

  if (turnstileConfigured() && !(await verifyTurnstile(input.turnstileToken, request, 'partner'))) {
    return reply({ error: 'Please complete the check above the button and try again.' }, 400)
  }

  const { data: allowed } = await supabase.rpc('consume_rate_limit', {
    p_bucket: 'partner_register',
    p_client_hash: clientHash(request, 'partner_register'),
    p_window_seconds: 3600,
    p_max_hits: 5,
  })
  const { data: allowedOverall } = await supabase.rpc('consume_rate_limit', {
    p_bucket: 'partner_register_all',
    p_client_hash: globalHash('partner_register_all'),
    p_window_seconds: 3600,
    p_max_hits: 30,
  })
  if (allowed === false || allowedOverall === false) {
    return reply({ error: 'Too many attempts. Please try again later.' }, 429)
  }

  try {
    const email = input.email.toLowerCase()
    const { data: existing } = await supabase.from('referrers').select('id').eq('email', email).maybeSingle()
    if (existing) {
      return reply({ ok: true, alreadyRegistered: true })
    }
    const refCode = await createUniqueReferrerCode(supabase, input.name)
    const { error } = await supabase.from('referrers').insert({
      referrer_type: input.referrerType,
      name: input.name,
      agency: input.agency || null,
      branch: input.branch || null,
      mobile: input.mobile,
      email,
      notes: input.notes || null,
      ref_code: refCode,
      status: 'pending',
      source: 'self',
    })
    if (error) throw new Error(error.message)

    await sendEmail(
      markTest(
        {
          to: ownerEmail(),
          subject: `New referral partner – ${input.name}`,
          text: `${input.name}${input.agency ? `, ${input.agency}` : ''}${input.branch ? ` ${input.branch}` : ''}
${referrerTypeLabel(input.referrerType)}
${input.mobile} · ${email}
${input.notes ? `\n${input.notes}\n` : ''}
Code: ${refCode} (waiting for approval)

${SITE_URL}/admin#referrers`,
        },
        isExcludedRequest(request),
      ),
    )
    return reply({ ok: true })
  } catch (error) {
    console.error('partner_register_failed', { message: error instanceof Error ? error.message : 'unknown' })
    return reply({ error: 'We could not save your details. Please email us instead.' }, 500)
  }
}
