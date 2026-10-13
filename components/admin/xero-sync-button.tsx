'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function XeroSyncButton({ jobId, label }: { jobId: string; label: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function sync() {
    setBusy(true)
    setMessage('Sending to Xero…')
    const response = await fetch(`/api/admin/jobs/${jobId}/xero`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as {
      error?: string
      invoiceNumber?: string | null
    }
    setBusy(false)
    if (!response?.ok) {
      setMessage(result.error || 'Xero did not accept it.')
      return
    }
    setMessage(`Done${result.invoiceNumber ? `: ${result.invoiceNumber}` : ''}.`)
    router.refresh()
  }

  return (
    <span className="admin-actions">
      <button className="admin-button small" type="button" disabled={busy} onClick={() => void sync()}>
        {label}
      </button>
      {message && <span className="admin-inline-message">{message}</span>}
    </span>
  )
}
