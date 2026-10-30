// Server-only. Emails a referral partner their link, with the QR code shown in
// the email and attached.
import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { referrerLinkEmail, referrerLinkEmailZh } from '@/lib/order-emails'
import { qrPng } from '@/lib/qr'
import { referralLink } from '@/lib/referrals'
import { SITE_URL } from '@/lib/site'

export async function emailReferrerLink(supabase: SupabaseClient, id: string, justApproved: boolean) {
  const { data, error } = await supabase
    .from('referrers')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) throw new Error('Referrer not found.')
  if (!data.email) throw new Error('This referrer has no email address.')
  if (data.status === 'disabled') throw new Error('Turn this referrer back on first.')
  const chinese = data.language === 'zh'
  const link = referralLink(SITE_URL, data.ref_code, data.language)
  const result = await sendEmail(
    (chinese ? referrerLinkEmailZh : referrerLinkEmail)({
      to: data.email,
      name: data.name,
      link,
      qrPngBase64: qrPng(link).toString('base64'),
      justApproved,
    }),
  )
  if (!result.sent) throw new Error(result.reason)
}
