import { NextResponse } from 'next/server'
import { z } from 'zod'
import { answerBookingRequest } from '@/lib/booking-requests'
import { clientHash, isSameOriginMutation, readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('confirm'), slot: z.iso.datetime({ offset: true }) }).strict(),
  z
    .object({
      action: z.literal('decline'),
      message: z.string().trim().max(1000).default(''),
    })
    .strict(),
])

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

// The agent's answer from /booking/<token>: a chosen time, or "none suit".
// Only a click on the page counts (POST), so email link scanners that open
// the link cannot confirm anything.
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!isSameOriginMutation(request)) return reply({ error: 'Invalid request.' }, 403)
  const supabase = getSupabaseAdmin()
  if (!supabase) return reply({ error: 'Unavailable.' }, 503)

  const { data: allowed } = await supabase.rpc('consume_rate_limit', {
    p_bucket: 'booking_reply',
    p_client_hash: clientHash(request, 'booking_reply'),
    p_window_seconds: 3600,
    p_max_hits: 30,
  })
  if (allowed === false) return reply({ error: 'Too many attempts. Please call us instead.' }, 429)

  try {
    const { token } = await context.params
    const parsed = schema.safeParse(await readJsonBody(request, 3_000))
    if (!parsed.success) return reply({ error: 'Please check your answer.' }, 400)

    const result = await answerBookingRequest(supabase, token, parsed.data)
    if (!result.ok) {
      return result.reason === 'closed'
        ? reply({ error: 'This request has already been answered or has closed.' }, 409)
        : reply({ error: 'Please choose one of the times shown.' }, 400)
    }
    return reply({ ok: true })
  } catch (error) {
    console.error('booking_reply_failed', { message: error instanceof Error ? error.message : 'unknown' })
    return reply({ error: 'Something went wrong. Please call us instead.' }, 500)
  }
}
