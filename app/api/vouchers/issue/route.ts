import { NextResponse } from 'next/server'
import { z } from 'zod'
import { readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { isVoucherIssuer, issueVoucher } from '@/lib/vouchers'

export const runtime = 'nodejs'

const schema = z
  .object({
    // The 137B job number, e.g. 137B-20261016-1077.
    reference: z.string().trim().regex(/^[A-Za-z0-9-]{4,60}$/),
    email: z.union([z.literal(''), z.email().max(180)]).default(''),
  })
  .strict()

// Called by the 137B website (server to server, shared secret) when it sends
// a customer their Building & Pest voucher. Returns the code to put in the
// email; the same job always gets the same code.
export async function POST(request: Request) {
  if (!isVoucherIssuer(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorised' }, { status: 401 })
  }
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ ok: false, error: 'The database is not configured.' }, { status: 503 })
  try {
    const input = schema.parse(await readJsonBody(request, 2_000))
    const voucher = await issueVoucher(supabase, {
      sourceReference: input.reference,
      email: input.email ? input.email.toLowerCase() : null,
    })
    return NextResponse.json(
      {
        ok: true,
        code: voucher.code,
        amountCents: voucher.amount_cents,
        expiresAt: voucher.expires_at,
        created: voucher.created,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    const message = error instanceof z.ZodError ? 'Invalid request.' : error instanceof Error ? error.message : 'Unable to issue voucher.'
    return NextResponse.json({ ok: false, error: message }, { status: error instanceof z.ZodError ? 400 : 500 })
  }
}
