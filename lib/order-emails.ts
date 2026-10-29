// Plain-text emails for the quote, payment and booking steps.
import type { EmailMessage } from '@/lib/email'
import { formatAud } from '@/lib/pricing'
import { TRANSLATION_FEE_CENTS } from '@/lib/translation'
import { CONTACT_EMAIL, CONTACT_PHONE, OWNER_MOBILE, OWNER_SIGNATURE_NAME, SITE_URL } from '@/lib/site'
import { smsSafe } from '@/lib/sms'

const SIGN_OFF = `Home Audit\n${CONTACT_PHONE}\n${CONTACT_EMAIL}\n${SITE_URL}`

export function inspectionDateLabel(iso: string) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export function quoteReadyEmail(input: {
  to: string
  firstName: string
  address: string
  totalCents: number
  url: string
}): EmailMessage {
  return {
    to: input.to,
    subject: `Your inspection quote for ${input.address}`,
    text: `Hi ${input.firstName},

Thanks for your request. The price for the inspection at ${input.address} is ${formatAud(input.totalCents)} including GST.

You can review the details and pay here:
${input.url}

Before you pay, please read our Inspection Agreement on that page. It sets out what the inspection covers, what is not included, the cancellation terms and the limitation of liability. You accept it by ticking the box.

Once payment is made, you can tell us who to contact to arrange access.

${SIGN_OFF}`,
  }
}

export function requestReceivedEmail(input: {
  to: string
  firstName: string
  address: string
  url: string
}): EmailMessage {
  return {
    to: input.to,
    subject: `We have your inspection request for ${input.address}`,
    text: `Hi ${input.firstName},

Thanks for your request for ${input.address}. We need to check a few details before we can give you a price. We will email you the price and a link to pay.

You can see your request here:
${input.url}

${SIGN_OFF}`,
  }
}

export function paymentReceivedEmail(input: {
  to: string
  firstName: string
  address: string
  reference: string
  totalCents: number
  url: string
}): EmailMessage {
  return {
    to: input.to,
    subject: `Payment received – ${input.address}`,
    text: `Hi ${input.firstName},

We have received your payment of ${formatAud(input.totalCents)} for the inspection at ${input.address} (reference ${input.reference}).

If you have not done so already, please tell us your situation and who we should contact to arrange access:
${input.url}

We will email you once the inspection date is confirmed.

Your Inspection Agreement:
${SITE_URL}/inspection-agreement

${SIGN_OFF}`,
  }
}

export function bookingConfirmedEmail(input: {
  to: string
  firstName: string
  address: string
  dateIso: string
}): EmailMessage {
  return {
    to: input.to,
    subject: `Inspection date confirmed – ${input.address}`,
    text: `Hi ${input.firstName},

The inspection at ${input.address} is booked for ${inspectionDateLabel(input.dateIso)}.

We will provide a digital copy of the report after the inspection. If anything changes with access, reply to this email.

${SIGN_OFF}`,
  }
}

export function reviewRequestEmail(input: { to: string; firstName: string; reviewUrl: string }): EmailMessage {
  return {
    to: input.to,
    subject: 'Thanks for choosing Home Audit',
    text: `Hi ${input.firstName},

Thank you for choosing Home Audit for your inspection. If you have a minute, a Google review would help other buyers find us:
${input.reviewUrl}

${SIGN_OFF}`,
  }
}

export function reviewRequestSms(firstName: string, reviewUrl: string) {
  return `Hi ${firstName}, thank you for choosing Home Audit for your inspection. If you have a minute, we would really appreciate a Google review: ${reviewUrl}`
}

// The buyer's situation is never included: it is private to the buyer.
export function agentSms(input: {
  agentName: string
  buyerName: string
  address: string
  dateHint: string
  service: string
}) {
  const greeting = input.agentName ? `Hi ${input.agentName.split(' ')[0]}` : 'Hi'
  return `${greeting}, this is Home Audit. We have been engaged by ${buyerPhrase(input.buyerName)} to do a ${input.service.toLowerCase()} at ${input.address}. Could you let us know a time that suits for access${input.dateHint ? `, ideally ${input.dateHint}` : ''}? Thank you.`
}

export function ownerPaymentProblemEmail(input: {
  to: string
  reference: string
  problem: 'duplicate' | 'mismatch'
  amountCents: number
  sessionId: string
}): EmailMessage {
  return {
    to: input.to,
    subject: `Check payment – ${input.reference}`,
    text: `${input.reference}

${
  input.problem === 'duplicate'
    ? `This job was already paid, and a second payment of ${formatAud(input.amountCents)} came in. Refund it in Stripe.`
    : `A payment of ${formatAud(input.amountCents)} does not match the current price of this job. The job was not marked paid. Check it in Stripe and in the dashboard.`
}

Stripe Checkout session: ${input.sessionId}`,
  }
}

export function ownerNewRequestEmail(input: {
  to: string
  reference: string
  address: string
  decision: 'instant' | 'manual'
  reasons: string[]
  refCode?: string | null
  adminUrl: string
}): EmailMessage {
  return {
    to: input.to,
    subject: `${input.decision === 'manual' ? 'Price review needed' : 'New instant quote'} – ${input.address}`,
    text: `${input.reference}
${input.address}

${input.decision === 'manual' ? `Needs a price review:\n- ${input.reasons.join('\n- ')}` : 'Quoted automatically. Waiting for payment.'}
${input.refCode ? `\nReferral code: ${input.refCode}\n` : ''}
${input.adminUrl}`,
  }
}

export function ownerPaidEmail(input: {
  to: string
  reference: string
  address: string
  totalCents: number
  adminUrl: string
}): EmailMessage {
  return {
    to: input.to,
    subject: `Paid ${formatAud(input.totalCents)} – ${input.address}`,
    text: `${input.reference}
${input.address}

Payment received. Next: check the listing, find the agent and arrange a time.

${input.adminUrl}`,
  }
}

// ---- Booking requests to the agent (or other access contact) ---------------

export function slotLabel(iso: string) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date(iso))
    .replace(/\b(am|pm)\b/i, (part) => part.toLowerCase())
}

// Short form for texts: "Tue 21 Oct 10am", "Wed 22 Oct 2:30pm".
export function shortSlotLabel(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Melbourne',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  )
  const minutes = parts.minute === '00' ? '' : `:${parts.minute}`
  return `${parts.weekday} ${parts.day} ${parts.month} ${parts.hour}${minutes}${String(parts.dayPeriod || '').toLowerCase()}`
}

function buyerPhrase(buyerName: string) {
  return buyerName ? `the buyer, ${buyerName}` : 'the buyer'
}

function firstNameOf(name: string) {
  return name.trim().split(/\s+/)[0] || ''
}

// The agent sees the buyer's name, so they know whose inspection it is. The
// buyer's situation is never included.
export function bookingRequestEmail(input: {
  to: string
  recipientName: string
  buyerName: string
  address: string
  service: string
  slots: string[]
  url: string
}): EmailMessage {
  const first = firstNameOf(input.recipientName)
  const times = input.slots.map((slot) => `- ${slotLabel(slot)}`).join('\n')
  return {
    to: input.to,
    subject: `Inspection access – ${input.address}`,
    text: `Hi${first ? ` ${first}` : ''},

Home Audit has been engaged to do a ${input.service.toLowerCase()} at ${input.address} for ${buyerPhrase(input.buyerName)}.

Could one of these times work for access?
${times}

To confirm a time, open this link and press the time that suits:
${input.url}

If none of them work, you can suggest another time on the same page, or reply to this email.

${SIGN_OFF}`,
  }
}

// Kept short and in plain characters (see smsSafe in lib/sms.ts).
export function bookingRequestSms(input: {
  recipientName: string
  buyerName: string
  address: string
  service: string
  slots: string[]
  url: string
}) {
  const first = firstNameOf(input.recipientName)
  const times = input.slots.map(shortSlotLabel)
  const choice =
    times.length === 1 ? times[0] : `${times.slice(0, -1).join(', ')} or ${times[times.length - 1]}`
  const buyer = input.buyerName ? ` for buyer ${input.buyerName}` : ''
  return smsSafe(
    `Hi${first ? ` ${first}` : ''}, Home Audit here. We are inspecting ${input.address}${buyer}. Can we access ${choice}? Please confirm here: ${input.url}`,
  )
}

export function ownerBookingReplyEmail(input: {
  to: string
  reference: string
  address: string
  recipientName: string
  outcome: 'confirmed' | 'declined'
  chosenIso?: string
  message?: string
  customerEmailed: 'sent' | 'not_sent' | 'unchanged'
  adminUrl: string
}): EmailMessage {
  const who = input.recipientName || 'The agent'
  const lines =
    input.outcome === 'confirmed'
      ? [
          `${who} confirmed ${slotLabel(input.chosenIso!)}.`,
          input.customerEmailed === 'sent'
            ? 'The customer has been emailed the date.'
            : input.customerEmailed === 'not_sent'
              ? 'The date email to the customer did NOT go out. Send it from the dashboard.'
              : 'The customer already had this date.',
        ]
      : [`${who} said none of the times suit.`]
  if (input.message) lines.push('', `Their note: ${input.message}`)
  return {
    to: input.to,
    subject: `${input.outcome === 'confirmed' ? 'Booked' : 'Times not suitable'} – ${input.address}`,
    text: `${input.reference}
${input.address}

${lines.join('\n')}

${input.adminUrl}`,
  }
}

// ---- Referral partners ------------------------------------------------------------

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

export const REFERRAL_QR_CONTENT_ID = 'referral-qr'
export const REFERRAL_QR_FILENAME = 'Home-Audit-referral-QR.png'

// Owner request 25 Oct 2026: the QR code is shown in the email and also
// attached, and the email is signed by Alan Hou with his mobile.
export function referrerLinkEmail(input: {
  to: string
  name: string
  link: string
  qrPngBase64: string
  justApproved: boolean
}): EmailMessage {
  const first = input.name.trim().split(/\s+/)[0] || ''
  const greeting = `Hi${first ? ` ${first}` : ''},`
  const opening = input.justApproved
    ? 'Thanks for registering. Your registration as a Home Audit referral partner is approved.'
    : 'You are set up as a Home Audit referral partner.'
  const explain =
    'When a client opens this link and books an inspection within 90 days, the booking is recorded under your name. You can send the link by email or text, or put it in your client information.'
  const signature = [OWNER_SIGNATURE_NAME, 'Home Audit', `Mobile ${OWNER_MOBILE}`, `Office ${CONTACT_PHONE}`, CONTACT_EMAIL, SITE_URL]
  const p = 'margin:0 0 14px'
  const html = `<!doctype html><html lang="en-AU"><body style="margin:0;background:#f7f1e8;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#252b2a">
<div style="max-width:600px;margin:0 auto;padding:24px 16px"><div style="background:#fffdf9;border:1px solid #cdd5ce;border-radius:12px;padding:26px">
<p style="${p}">${escapeHtml(greeting)}</p>
<p style="${p}">${escapeHtml(opening)}</p>
<p style="margin:0 0 6px"><strong>Your referral link</strong></p>
<p style="margin:0 0 18px"><a href="${escapeHtml(input.link)}" style="display:inline-block;background:#294b4a;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:700">Open my referral link</a><br><span style="font-size:13px;color:#64716c">${escapeHtml(input.link)}</span></p>
<p style="margin:0 0 6px"><strong>Your QR code</strong> &mdash; print it or show it to clients. Scanning it opens the same link. It is also attached.</p>
<p style="margin:0 0 18px"><img src="cid:${REFERRAL_QR_CONTENT_ID}" width="200" height="200" alt="QR code for your Home Audit referral link" style="display:block;border:1px solid #cdd5ce;border-radius:8px"></p>
<p style="${p}">${escapeHtml(explain)}</p>
<p style="${p}">Questions about referrals? Reply to this email or call me.</p>
<p style="margin:0">${signature.map(escapeHtml).join('<br>')}</p>
</div></div></body></html>`

  return {
    to: input.to,
    subject: 'Your Home Audit referral link',
    text: `${greeting}

${opening}

Your referral link:
${input.link}

${explain}

Your QR code is attached. Print it or show it to clients. Scanning it opens the same link.

Questions about referrals? Reply to this email or call me.

${signature.join('\n')}`,
    html,
    attachments: [{ filename: REFERRAL_QR_FILENAME, content: input.qrPngBase64, contentId: REFERRAL_QR_CONTENT_ID }],
  }
}

// The same email for partners whose clients speak Chinese: the link opens
// the Chinese website, and the email says the Chinese pages and the Chinese
// report translation are available.
export function referrerLinkEmailZh(input: {
  to: string
  name: string
  link: string
  qrPngBase64: string
  justApproved: boolean
}): EmailMessage {
  const first = input.name.trim().split(/\s+/)[0] || ''
  const greeting = `${first ? `${first}，` : ''}您好！`
  const opening = input.justApproved
    ? '感谢您的注册，您已成为 Home Audit 推荐合作伙伴。'
    : '您是 Home Audit 的推荐合作伙伴。'
  const news = [
    'Home Audit 中文网站已上线：客户可以用中文了解验房服务、在线报价和预约。',
    `验房报告可加购完整的中文翻译版（${formatAud(TRANSLATION_FEE_CENTS)}），与英文报告同时提供，照片和平面图齐全，方便华人买家看懂每一项缺陷。英文报告为正式版本。`,
  ]
  const explain =
    '客户通过下面的链接或二维码进入网站，并在 90 天内预约验房，这单就会记在您的名下。您可以通过微信、短信或邮件发送链接，也可以把二维码放在您的客户资料里。'
  const signature = [OWNER_SIGNATURE_NAME, 'Home Audit', `Mobile ${OWNER_MOBILE}`, `Office ${CONTACT_PHONE}`, CONTACT_EMAIL, SITE_URL]
  const p = 'margin:0 0 14px'
  const html = `<!doctype html><html lang="zh-CN"><body style="margin:0;background:#f7f1e8;font-family:Arial,'PingFang SC','Microsoft YaHei',sans-serif;font-size:15px;line-height:1.7;color:#252b2a">
<div style="max-width:600px;margin:0 auto;padding:24px 16px"><div style="background:#fffdf9;border:1px solid #cdd5ce;border-radius:12px;padding:26px">
<p style="${p}">${escapeHtml(greeting)}</p>
<p style="${p}">${escapeHtml(opening)}</p>
<p style="margin:0 0 6px"><strong>新上线</strong></p>
<ul style="margin:0 0 16px;padding-left:20px">${news.map((line) => `<li style="margin:0 0 6px">${escapeHtml(line)}</li>`).join('')}</ul>
<p style="margin:0 0 6px"><strong>您的专属推荐链接（中文网站）</strong></p>
<p style="margin:0 0 18px"><a href="${escapeHtml(input.link)}" style="display:inline-block;background:#294b4a;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:700">打开我的推荐链接</a><br><span style="font-size:13px;color:#64716c">${escapeHtml(input.link)}</span></p>
<p style="margin:0 0 6px"><strong>您的二维码</strong>——可打印或给客户扫码，扫码打开的是同一个链接。附件里也有。</p>
<p style="margin:0 0 18px"><img src="cid:${REFERRAL_QR_CONTENT_ID}" width="200" height="200" alt="Home Audit 推荐链接二维码" style="display:block;border:1px solid #cdd5ce;border-radius:8px"></p>
<p style="${p}">${escapeHtml(explain)}</p>
<p style="${p}">有任何问题，直接回复这封邮件或给我打电话。</p>
<p style="margin:0">${signature.map(escapeHtml).join('<br>')}</p>
</div></div></body></html>`

  return {
    to: input.to,
    subject: 'Home Audit 中文网站和中文验房报告已上线 – 您的推荐链接',
    text: `${greeting}

${opening}

新上线：
${news.map((line) => `- ${line}`).join('\n')}

您的专属推荐链接（中文网站）：
${input.link}

${explain}

二维码在附件里，可打印或给客户扫码，扫码打开的是同一个链接。

有任何问题，直接回复这封邮件或给我打电话。

${signature.join('\n')}`,
    html,
    attachments: [{ filename: REFERRAL_QR_FILENAME, content: input.qrPngBase64, contentId: REFERRAL_QR_CONTENT_ID }],
  }
}

