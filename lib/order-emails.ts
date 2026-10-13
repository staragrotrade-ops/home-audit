// Plain-text emails for the quote, payment and booking steps.
import type { EmailMessage } from '@/lib/email'
import { formatAud } from '@/lib/pricing'
import { CONTACT_EMAIL, CONTACT_PHONE, SITE_URL } from '@/lib/site'

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

We will send the report by email after the inspection. If anything changes with access, reply to this email.

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
export function agentSms(input: { agentName: string; address: string; dateHint: string; service: string }) {
  const greeting = input.agentName ? `Hi ${input.agentName.split(' ')[0]}` : 'Hi'
  return `${greeting}, this is Home Audit. We have been engaged to do a ${input.service.toLowerCase()} at ${input.address}. Could you let us know a time that suits for access${input.dateHint ? `, ideally ${input.dateHint}` : ''}? Thank you.`
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
  adminUrl: string
}): EmailMessage {
  return {
    to: input.to,
    subject: `${input.decision === 'manual' ? 'Price review needed' : 'New instant quote'} – ${input.address}`,
    text: `${input.reference}
${input.address}

${input.decision === 'manual' ? `Needs a price review:\n- ${input.reasons.join('\n- ')}` : 'Quoted automatically. Waiting for payment.'}

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

function shortSlotLabel(iso: string) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date(iso))
    .replace(/\b(am|pm)\b/i, (part) => part.toLowerCase())
}

function firstNameOf(name: string) {
  return name.trim().split(/\s+/)[0] || ''
}

// The buyer's name and situation are not included: the agent only needs the
// property and the times.
export function bookingRequestEmail(input: {
  to: string
  recipientName: string
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

Home Audit has been engaged to do a ${input.service.toLowerCase()} at ${input.address} for the buyer.

Could one of these times work for access?
${times}

To confirm a time, open this link and press the time that suits:
${input.url}

If none of them work, you can suggest another time on the same page, or reply to this email.

${SIGN_OFF}`,
  }
}

export function bookingRequestSms(input: {
  recipientName: string
  address: string
  service: string
  slots: string[]
  url: string
}) {
  const first = firstNameOf(input.recipientName)
  const times = input.slots.map(shortSlotLabel)
  const choice =
    times.length === 1 ? times[0] : `${times.slice(0, -1).join(', ')} or ${times[times.length - 1]}`
  return `Hi${first ? ` ${first}` : ''}, this is Home Audit. We have been engaged to do a ${input.service.toLowerCase()} at ${input.address}. Would ${choice} work for access? Tap to confirm or suggest another time: ${input.url}`
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
