'use client'

import { useState } from 'react'

export function PayButton({ token, label }: { token: string; label: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function pay() {
    setBusy(true)
    setError('')
    const response = await fetch(`/api/order/${token}/checkout`, { method: 'POST' }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as { url?: string; error?: string }
    if (response?.ok && result.url) {
      window.location.href = result.url
      return
    }
    setBusy(false)
    setError(result.error || 'Payment could not be started. Please try again.')
  }

  return (
    <div className="order-pay">
      <button className="button" type="button" onClick={pay} disabled={busy}>
        {busy ? 'Opening secure payment…' : label}
      </button>
      {error && (
        <p className="quote-status" data-type="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
