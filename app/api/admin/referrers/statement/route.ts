import { adminJson, requireAdmin } from '@/lib/admin-api'
import { loadReferralStatement, loadReferrers } from '@/lib/referral-store'
import { isMonthKey, referralStatementCsv } from '@/lib/referrals'

export const runtime = 'nodejs'

// Monthly referral statement as CSV: /api/admin/referrers/statement?month=2026-10
export async function GET(request: Request) {
  const supabase = requireAdmin(request, false)
  if (supabase instanceof Response) return supabase
  const month = new URL(request.url).searchParams.get('month')
  if (!isMonthKey(month)) return adminJson({ ok: false, error: 'Month must look like 2026-10.' }, 400)
  try {
    const { referrers } = await loadReferrers(supabase)
    const rows = await loadReferralStatement(supabase, month, referrers)
    return new Response(referralStatementCsv(month, rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="home-audit-referrals-${month}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return adminJson({ ok: false, error: error instanceof Error ? error.message : 'Unable to build the statement.' }, 500)
  }
}
