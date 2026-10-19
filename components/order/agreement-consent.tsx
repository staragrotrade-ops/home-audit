'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// The tick box for the Inspection Agreement. Before payment it sits above the
// pay button: ticking is required, the acceptance is saved, then payment
// opens. For a job already paid another way it saves the acceptance and
// shows the booking details form.
export function AgreementConsent({
  token,
  version,
  versionLabel,
  mode,
  label,
}: {
  token: string
  version: string
  versionLabel: string
  mode: 'pay' | 'accept'
  label: string
}) {
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function post(path: string, body?: unknown) {
    const response = await fetch(`/api/order/${token}/${path}`, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as { url?: string; error?: string }
    return { ok: Boolean(response?.ok), ...result }
  }

  async function submit() {
    if (!agreed) {
      setError('Please tick the box to confirm you have read and agree to the Inspection Agreement.')
      return
    }
    setBusy(true)
    setError('')
    const accepted = await post('agreement', { agreed: true, version })
    if (!accepted.ok) {
      setBusy(false)
      setError(accepted.error || 'The agreement could not be saved. Please try again.')
      return
    }
    if (mode === 'accept') {
      setBusy(false)
      router.refresh()
      return
    }
    const checkout = await post('checkout')
    if (checkout.ok && checkout.url) {
      window.location.href = checkout.url
      return
    }
    setBusy(false)
    setError(checkout.error || 'Payment could not be started. Please try again.')
  }

  return (
    <div className="order-pay agreement-consent">
      <label className="checkbox-option agreement-tick">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(event) => {
            setAgreed(event.target.checked)
            if (event.target.checked) setError('')
          }}
        />
        <span>
          I have read and agree to the{' '}
          <a href="/inspection-agreement" target="_blank" rel="noopener">
            Inspection Agreement
          </a>{' '}
          (version {versionLabel}), including the scope, exclusions, cancellation terms and limitation of
          liability.
        </span>
      </label>
      <button className="button" type="button" onClick={submit} disabled={busy} aria-disabled={!agreed}>
        {busy ? (mode === 'pay' ? 'Opening secure payment…' : 'Saving…') : label}
      </button>
      {error && (
        <p className="quote-status" data-type="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
