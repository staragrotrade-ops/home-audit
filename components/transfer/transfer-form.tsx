'use client'

import { useState } from 'react'

export function TransferForm({ code, priceLabel }: { code: string; priceLabel: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    const response = await fetch('/api/report-transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        firstName: form.get('firstName'),
        lastName: form.get('lastName'),
        email: form.get('email'),
        mobile: form.get('mobile'),
        website: form.get('website') || '',
      }),
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as { error?: string; url?: string }
    if (!response?.ok || !result.url) {
      setBusy(false)
      setError(result.error || 'The order could not be started. Please try again.')
      return
    }
    window.location.assign(result.url)
  }

  return (
    <form className="order-details" onSubmit={submit}>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="firstName">First name *</label>
          <input id="firstName" name="firstName" required maxLength={60} autoComplete="given-name" />
        </div>
        <div className="field">
          <label htmlFor="lastName">Last name *</label>
          <input id="lastName" name="lastName" required maxLength={60} autoComplete="family-name" />
        </div>
        <div className="field">
          <label htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" required maxLength={160} autoComplete="email" />
        </div>
        <div className="field">
          <label htmlFor="mobile">Mobile *</label>
          <input id="mobile" name="mobile" type="tel" required pattern="[0-9 +()\-]{8,20}" autoComplete="tel" />
        </div>
      </div>
      <p className="order-hint">The report is issued in this name. It is emailed to this address after payment.</p>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" hidden aria-hidden="true" />
      {error && (
        <p className="quote-status" data-type="error" role="alert">
          {error}
        </p>
      )}
      <button className="button" type="submit" disabled={busy}>
        {busy ? 'Starting…' : `Continue to pay ${priceLabel}`}
      </button>
    </form>
  )
}
