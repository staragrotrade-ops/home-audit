'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// "Send to customer": emails the customer a link to download the current report.
export function ReportSendButton({
  jobId,
  email,
  sent,
  paid,
}: {
  jobId: string
  email: string | null
  sent: boolean
  paid: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function send() {
    if (!email) return
    const question = sent
      ? `Send the report link to ${email} again?`
      : `Email the report to ${email}?`
    if (!window.confirm(question)) return
    setBusy(true)
    setMessage('Sending…')
    const response = await fetch(`/api/admin/jobs/${jobId}/send-report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as { error?: string; sentTo?: string }
    setBusy(false)
    if (!response?.ok) {
      setMessage(result.error || 'Not sent.')
      return
    }
    setMessage(`Sent to ${result.sentTo}.`)
    router.refresh()
  }

  return (
    <span className="admin-actions">
      <button
        className="admin-button small"
        type="button"
        disabled={busy || !email || !paid}
        onClick={() => void send()}
      >
        {sent ? 'Send again' : 'Send to customer'}
      </button>
      {!email && <span className="admin-inline-message">No customer email</span>}
      {email && !paid && <span className="admin-inline-message">Not paid yet</span>}
      {message && <span className="admin-inline-message">{message}</span>}
    </span>
  )
}
