import { NextResponse } from 'next/server'
import { issueOrderToken, orderUrl } from '@/lib/access-tokens'
import { isExcludedRequest } from '@/lib/analytics-exclusion'
import { markTest, ownerEmail, sendEmail } from '@/lib/email'
import { ownerNewRequestEmail, quoteReadyEmail, requestReceivedEmail } from '@/lib/order-emails'
import { PRICING_VERSION, priceQuote } from '@/lib/pricing'
import { quoteRequestSchema } from '@/lib/quote-schema'
import { clientHash, globalHash, isSameOriginMutation } from '@/lib/request-guard'
import { SITE_URL } from '@/lib/site'
import { referralCodeFromRequest } from '@/lib/referral-store'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { turnstileConfigured, verifyTurnstile } from '@/lib/turnstile'
import { destinationAddress, driveMinutesFromBase } from '@/lib/travel'
import { priceAfterVoucher } from '@/lib/voucher-rules'
import { claimVoucherForJob, type VoucherClaim } from '@/lib/vouchers'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 100_000
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5

// First line of defence only: memory is per serverless instance. The shared
// limit in the database (consume_rate_limit) is checked after this.
const recentRequests = new Map<string, number[]>()

function isRateLimited(key: string) {
  const now = Date.now()
  const recent = (recentRequests.get(key) || []).filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS,
  )

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    recentRequests.set(key, recent)
    return true
  }

  recent.push(now)
  recentRequests.set(key, recent)

  if (recentRequests.size > 5000) {
    for (const [storedKey, times] of recentRequests) {
      if (times.every((time) => now - time >= RATE_LIMIT_WINDOW_MS)) {
        recentRequests.delete(storedKey)
      }
    }
  }

  return false
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true

  try {
    return new URL(origin).host === request.headers.get('host')
  } catch {
    return false
  }
}

// What the quote page may show about the voucher: applied or not.
function voucherResult(voucher: VoucherClaim) {
  if (!voucher) return null
  return voucher.applied
    ? { applied: true, amountCents: voucher.amountCents }
    : { applied: false }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  }

  const clientKey =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a few minutes.' },
      { status: 429 },
    )
  }

  // The content-length header can be absent or wrong, so measure the body.
  let body: unknown
  try {
    const raw = await request.text()
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })
    }
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = quoteRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Please check the information below.',
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const {
    intake_mode: intakeMode,
    analytics_session_id: sessionId,
    turnstile_token: turnstileToken,
    voucher_code: voucherCode,
    ...fields
  } = parsed.data

  // Online submission is switched on separately. The email handoff only keeps
  // a copy for the admin dashboard, so it is accepted whenever the database is
  // configured.
  if (intakeMode === 'submit' && process.env.QUOTE_SUBMISSION_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'Online quote submissions are not enabled yet.' },
      { status: 503 },
    )
  }

  // The email-handoff copy is sent by our own page with fetch(), which always
  // carries an Origin header; requests without one are not from the form.
  if (intakeMode === 'email_handoff' && !isSameOriginMutation(request)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 403 })
  }

  // Preview deployments share the database: never create jobs from them.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return intakeMode === 'email_handoff'
      ? NextResponse.json({ ok: true, reference: null }, { status: 201 })
      : NextResponse.json({ error: 'Quotes cannot be sent from a preview site.' }, { status: 503 })
  }

  // Quietly accept bot-filled honeypot submissions without creating a record.
  if (fields.website) {
    return NextResponse.json({ ok: true, reference: null }, { status: 201 })
  }

  // Online submissions create a quote, look up the driving time and send
  // emails, so they need a passed bot check. Without Turnstile configured the
  // online form stays closed.
  if (intakeMode === 'submit') {
    if (!turnstileConfigured()) {
      return NextResponse.json(
        { error: 'Online quote submissions are not enabled yet.' },
        { status: 503 },
      )
    }
    if (!(await verifyTurnstile(turnstileToken, request))) {
      return NextResponse.json(
        { error: 'Please complete the security check and try again.' },
        { status: 400 },
      )
    }
  }

  // Keep only the fields that belong to the chosen service family.
  // The agent phone is saved on the job after it is created (the database
  // function does not take it).
  const { agent_phone: agentPhone, form_language: formLanguage, ...jobFields } = fields
  const payload =
    jobFields.service_family === 'new_home'
      ? { ...jobFields, inspection_type: '' as const }
      : {
          ...jobFields,
          new_home_stages: [],
          builder_name: '',
          expected_ready_date: '' as const,
        }

  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json(
      { error: 'The quote service is temporarily unavailable.' },
      { status: 503 },
    )
  }

  const { data: allowed, error: limitError } = await supabase.rpc('consume_rate_limit', {
    p_bucket: 'quote',
    p_client_hash: clientHash(request, 'quote'),
    p_window_seconds: 3600,
    p_max_hits: 8,
  })
  // A site-wide ceiling as well, so a flood from many addresses is capped.
  const { data: allowedOverall, error: overallError } = await supabase.rpc('consume_rate_limit', {
    p_bucket: 'quote_all',
    p_client_hash: globalHash('quote_all'),
    p_window_seconds: 3600,
    p_max_hits: 40,
  })
  if ((!limitError && allowed === false) || (!overallError && allowedOverall === false)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
  }

  const { data, error } = await supabase.rpc('create_quote_job', { payload })

  if (error) {
    console.error('quote_create_failed', {
      code: error.code,
      message: error.message,
    })
    return NextResponse.json(
      { error: 'We could not save the request. Please try again.' },
      { status: 500 },
    )
  }

  const result = Array.isArray(data) ? data[0] : data
  const jobId: string | undefined = result?.job_id
  const reference: string | null = result?.public_reference || null
  if (!jobId) {
    return NextResponse.json({ ok: true, reference }, { status: 201 })
  }

  const isTest = isExcludedRequest(request)
  const update: Record<string, unknown> = {
    intake_channel: intakeMode === 'email_handoff' ? 'email_handoff' : 'web_form',
    analytics_session_id: sessionId || null,
    // Requests from the owner's own browser are marked as tests.
    is_test: isTest,
    price_guide_band: fields.price_guide_band,
    listing_url: fields.listing_url || null,
    // Shown to the owner in the dashboard.
    ...(formLanguage === 'zh'
      ? { internal_notes: 'Quote form filled in Chinese (中文表格). Reply in Chinese if possible.' }
      : {}),
  }

  // Agent details from the form, shown again on the order page after payment.
  // Written on their own so a problem here never loses the request.
  if (fields.agent_email || agentPhone) {
    const { error: agentError } = await supabase
      .from('jobs')
      .update({ agent_email: fields.agent_email || null, agent_phone: agentPhone || null })
      .eq('id', jobId)
    if (agentError) console.error('quote_agent_details_failed', { code: agentError.code })
  }

  // The referral partner whose link the customer used (saved for 90 days).
  // Written on its own so a database without the referrals columns still
  // saves the request.
  const refCode = await referralCodeFromRequest(request, supabase).catch(() => null)
  if (refCode) {
    const { error: refError } = await supabase.from('jobs').update({ ref_code: refCode }).eq('id', jobId)
    if (refError) console.error('quote_ref_code_failed', { code: refError.code })
  }

  // A Building & Pest voucher from the 137B website. A code that cannot be
  // used never blocks the request; the owner is told why in the email.
  let voucher: VoucherClaim = null
  try {
    voucher = await claimVoucherForJob(supabase, jobId, voucherCode)
  } catch (voucherError) {
    console.error('quote_voucher_failed', {
      message: voucherError instanceof Error ? voucherError.message : 'unknown',
    })
    voucher = { applied: false, code: voucherCode, note: `Voucher ${voucherCode} could not be checked; check it by hand.` }
  }
  const voucherNote = voucher
    ? voucher.applied
      ? `Voucher ${voucher.code}: $${(voucher.amountCents / 100).toFixed(2)} off (included in the price).`
      : voucher.note
    : null

  // The email handoff only keeps a copy; pricing happens on real submissions.
  if (intakeMode === 'email_handoff') {
    const { error: updateError } = await supabase.from('jobs').update(update).eq('id', jobId)
    if (updateError) console.error('quote_intake_update_failed', { code: updateError.code })
    return NextResponse.json({ ok: true, reference, voucher: voucherResult(voucher) }, { status: 201 })
  }

  const travel =
    fields.service_family === 'existing_home'
      ? await driveMinutesFromBase(
          destinationAddress(fields.property_address, fields.suburb, fields.postcode),
        )
      : null

  const pricing = priceQuote({
    serviceFamily: fields.service_family,
    inspectionType: payload.inspection_type,
    priceGuideBand: fields.price_guide_band,
    preferredDate: fields.preferred_date_1,
    deadline: fields.deadline,
    travelMinutes: travel?.minutes ?? null,
  })

  const voucherCents = voucher?.applied ? voucher.amountCents : 0
  const price =
    pricing.decision === 'instant'
      ? priceAfterVoucher(pricing.subtotalCents, pricing.gstCents, voucherCents)
      : null

  Object.assign(update, {
    travel_minutes: travel?.minutes ?? null,
    travel_distance_m: travel?.distanceMeters ?? null,
    pricing_decision: pricing.decision,
    pricing_reasons: pricing.reasons,
    pricing_rule_version: PRICING_VERSION,
    ...(price
      ? {
          quote_status: 'quoted',
          status: 'awaiting_payment',
          quote_subtotal: price.subtotalCents / 100,
          gst: price.gstCents / 100,
          quote_total: price.totalCents / 100,
        }
      : { quote_status: 'manual_review' }),
  })

  const { error: updateError } = await supabase.from('jobs').update(update).eq('id', jobId)
  if (updateError) {
    console.error('quote_pricing_update_failed', { code: updateError.code })
    // The request is saved but not priced: the owner must still hear about it.
    await sendEmail(
      markTest(
        ownerNewRequestEmail({
          to: ownerEmail(),
          reference: reference || jobId,
          address: fields.property_address,
          decision: 'manual',
          reasons: [
            'The automatic price could not be saved. Check the request and price it by hand.',
            ...(voucherNote ? [voucherNote] : []),
          ],
          refCode,
          adminUrl: `${SITE_URL}/admin?q=${encodeURIComponent(reference || '')}#jobs`,
        }),
        isTest,
      ),
      { supabase, jobId, templateKey: 'owner_new_request' },
    )
    return NextResponse.json(
      { ok: true, reference, decision: 'manual', voucher: voucherResult(voucher) },
      { status: 201 },
    )
  }

  let orderLink: string | null = null
  try {
    orderLink = orderUrl(await issueOrderToken(supabase, jobId))
  } catch (tokenError) {
    console.error('order_token_failed', {
      message: tokenError instanceof Error ? tokenError.message : 'unknown',
    })
  }

  // The customer always gets the link by email, so an unpaid quote is not
  // lost if the page is closed.
  if (orderLink) {
    const address = [fields.property_address, fields.suburb].filter(Boolean).join(', ')
    await sendEmail(
      price
        ? quoteReadyEmail({
            to: fields.email,
            firstName: fields.first_name,
            address,
            totalCents: price.totalCents,
            url: orderLink,
          })
        : requestReceivedEmail({
            to: fields.email,
            firstName: fields.first_name,
            address,
            url: orderLink,
          }),
      {
        supabase,
        jobId,
        templateKey: pricing.decision === 'instant' ? 'quote_ready' : 'request_received',
      },
    )
  }

  await sendEmail(
    markTest(
      ownerNewRequestEmail({
        to: ownerEmail(),
        reference: reference || jobId,
        address: fields.property_address,
        decision: pricing.decision,
        reasons: [...pricing.reasons, ...(voucherNote ? [voucherNote] : [])],
        refCode,
        adminUrl: `${SITE_URL}/admin?q=${encodeURIComponent(reference || '')}#jobs`,
      }),
      isTest,
    ),
    { supabase, jobId, templateKey: 'owner_new_request' },
  )

  return NextResponse.json(
    {
      ok: true,
      reference,
      decision: pricing.decision,
      orderUrl: orderLink,
      voucher: voucherResult(voucher),
    },
    { status: 201 },
  )
}
