// Server-only. Sends email through the Resend HTTP API (no extra package).
// When RESEND_API_KEY is not set, nothing is sent and the caller is told so.
import type { SupabaseClient } from '@supabase/supabase-js'
import { CONTACT_EMAIL } from '@/lib/site'

export type EmailMessage = {
  to: string
  subject: string
  text: string
  replyTo?: string
}

// Owner notifications for test orders still go out, marked in the subject,
// so the owner can check the emails work.
export function markTest(message: EmailMessage, isTest: boolean): EmailMessage {
  return isTest ? { ...message, subject: `[Test] ${message.subject}` } : message
}

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendEmail(
  message: EmailMessage,
  log?: { supabase: SupabaseClient; jobId: string; templateKey: string },
) {
  if (!emailConfigured()) return { sent: false, reason: 'Email is not configured.' }

  let providerId: string | null = null
  let status = 'sent'
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [message.to],
        reply_to: message.replyTo || process.env.EMAIL_REPLY_TO || CONTACT_EMAIL,
        subject: message.subject,
        text: message.text,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    const result = (await response.json().catch(() => ({}))) as { id?: string; message?: string }
    if (!response.ok) {
      status = 'failed'
      console.error('email_send_failed', { status: response.status, message: result.message })
    }
    providerId = result.id || null
  } catch (error) {
    status = 'failed'
    console.error('email_send_failed', { message: error instanceof Error ? error.message : 'unknown' })
  }

  if (log) {
    await log.supabase.from('communications').insert({
      job_id: log.jobId,
      channel: 'email',
      template_key: log.templateKey,
      recipient: message.to,
      provider_message_id: providerId,
      status,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    })
  }

  return status === 'sent' ? { sent: true as const } : { sent: false as const, reason: 'The email could not be sent.' }
}

export function ownerEmail() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || CONTACT_EMAIL
}
