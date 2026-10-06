import { NextResponse } from 'next/server'
import { quoteRequestSchema } from '@/lib/quote-schema'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const MAX_BODY_BYTES = 100_000
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5

// Best-effort limiter only: memory is per serverless instance, so this slows
// down simple repeat abuse but does NOT replace Turnstile or a shared-store
// rate limit, which remain required before live submissions are enabled.
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

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request is too large.' }, { status: 413 })
  }

  if (process.env.QUOTE_SUBMISSION_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'Online quote submissions are not enabled yet.' },
      { status: 503 },
    )
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

  // Quietly accept bot-filled honeypot submissions without creating a record.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true, reference: null }, { status: 201 })
  }

  // Keep only the fields that belong to the chosen service family.
  const payload =
    parsed.data.service_family === 'new_home'
      ? { ...parsed.data, inspection_type: '' as const }
      : {
          ...parsed.data,
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
  return NextResponse.json(
    {
      ok: true,
      reference: result?.public_reference || null,
    },
    { status: 201 },
  )
}
