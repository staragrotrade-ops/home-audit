import { adminJson, requireAdmin } from '@/lib/admin-api'
import { qrPng } from '@/lib/qr'
import { normaliseRefCode, referralLink } from '@/lib/referrals'
import { SITE_URL } from '@/lib/site'

export const runtime = 'nodejs'

// The QR code of a referral link, made here (no third-party QR service):
// /api/admin/referrers/qr?code=abc123
export async function GET(request: Request) {
  const supabase = requireAdmin(request, false)
  if (supabase instanceof Response) return supabase
  const code = normaliseRefCode(new URL(request.url).searchParams.get('code'))
  if (!code) return adminJson({ ok: false, error: 'Unknown referral code.' }, 400)
  const language = new URL(request.url).searchParams.get('lang') === 'zh' ? 'zh' : 'en'
  return new Response(new Uint8Array(qrPng(referralLink(SITE_URL, code, language))), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="home-audit-referral-${code}.png"`,
      'Cache-Control': 'no-store',
    },
  })
}
