'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// The report language, chosen before payment. Shown as one short line; the
// choice opens only when the customer asks for it. A customer who already
// chose Chinese sees that on the line without opening it.
export function TranslationOption({ token, on, feeLabel }: { token: string; on: boolean; feeLabel: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function change(next: boolean) {
    if (next === on) return
    setBusy(true)
    setError('')
    const response = await fetch(`/api/order/${token}/translation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ on: next }),
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as { error?: string }
    setBusy(false)
    if (!response?.ok) {
      setError(result.error || 'Could not change it. Please try again.')
      return
    }
    router.refresh()
  }

  return (
    <div className="translation-option">
      <p className="translation-summary">
        <span>
          Report language: <strong>{on ? `English + 简体中文 (+${feeLabel})` : 'English'}</strong>
        </span>
        <button
          type="button"
          className="text-button"
          aria-expanded={open}
          aria-controls="report-language-choices"
          onClick={() => setOpen(!open)}
        >
          {open ? 'Close' : 'Change language / 更改语言'}
        </button>
      </p>
      {open && (
        <fieldset id="report-language-choices" className="translation-choices" disabled={busy}>
          <legend className="sr-only">Report language</legend>
          <label className="checkbox-option">
            <input type="radio" name="report-language" checked={!on} onChange={() => void change(false)} />
            <span>
              <strong>English</strong> (included)
            </span>
          </label>
          <label className="checkbox-option">
            <input type="radio" name="report-language" checked={on} onChange={() => void change(true)} />
            <span>
              <strong>English + 简体中文 copy</strong> (+{feeLabel})
              <small>
                Same photos and floorplans, sent with the English report. The English
                report is the official version.
              </small>
            </span>
          </label>
        </fieldset>
      )}
      {error && (
        <p className="quote-status" data-type="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
