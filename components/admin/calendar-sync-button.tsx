'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const DONE = { created: 'Added to the calendar.', updated: 'Calendar updated.', removed: 'Removed from the calendar.', skipped: 'Nothing to do.' } as const

export function CalendarSyncButton({ jobId, label }: { jobId: string; label: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function sync() {
    setBusy(true)
    setMessage('Updating Google Calendar…')
    const response = await fetch(`/api/admin/jobs/${jobId}/calendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as {
      error?: string
      action?: keyof typeof DONE
    }
    setBusy(false)
    setMessage(response?.ok ? DONE[result.action || 'updated'] : result.error || 'Google Calendar did not accept it.')
    if (response?.ok) router.refresh()
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
