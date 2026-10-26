import { NextResponse } from 'next/server'
import { z } from 'zod'
import { jobIdForToken } from '@/lib/access-tokens'
import { loadOrder } from '@/lib/orders'
import { DOWNLOAD_COOKIE, DOWNLOAD_HOURS, checkDownloadCode, grantAccess } from '@/lib/report-download'
import { isSameOriginMutation, readJsonBody } from '@/lib/request-guard'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

const MESSAGES = {
  wrong: 'That code is not right. Check the latest email.',
  expired: 'The code has expired. Ask for a new one.',
  locked: 'Too many tries. Ask for a new code.',
} as const

// Confirms the emailed code; this browser may then download for 12 hours.
export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  if (!isSameOriginMutation(request)) return reply({ error: 'Invalid request.' }, 403)
  const supabase = getSupabaseAdmin()
  if (!supabase) return reply({ error: 'Unavailable.' }, 503)
  try {
    const { code } = z.object({ code: z.string().regex(/^\d{6}$/) }).parse(await readJsonBody(request, 200))
    const { token } = await context.params
    const jobId = await jobIdForToken(supabase, token)
    const job = jobId ? await loadOrder(supabase, jobId) : null
    if (!job) return reply({ error: 'This link has expired.' }, 404)
    const outcome = await checkDownloadCode(supabase, job.id, code)
    if (outcome !== 'ok') return reply({ error: MESSAGES[outcome] }, 400)

    const cookie = request.headers
      .get('cookie')
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${DOWNLOAD_COOKIE}=`))
      ?.slice(DOWNLOAD_COOKIE.length + 1)
    const response = reply({ ok: true })
    response.cookies.set(DOWNLOAD_COOKIE, grantAccess(cookie ? decodeURIComponent(cookie) : undefined, job.id), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/api/order',
      maxAge: DOWNLOAD_HOURS * 3600,
    })
    return response
  } catch {
    return reply({ error: 'Enter the 6-digit code.' }, 400)
  }
}
