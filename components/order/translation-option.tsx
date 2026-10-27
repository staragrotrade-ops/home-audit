'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// The paid Chinese translation, chosen before payment.
export function TranslationOption({ token, on, feeLabel }: { token: string; on: boolean; feeLabel: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function change(next: boolean) {
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
      <label className="checkbox-option">
        <input type="checkbox" checked={on} disabled={busy} onChange={(event) => void change(event.target.checked)} />
        <span>
          <strong>Chinese translation of the report 中文报告翻译</strong> (+{feeLabel}). A complete Simplified Chinese
          copy of your report, with the same photos and floorplans, sent with the English report. The English
          report is the official version.
        </span>
      </label>
      {error && (
        <p className="quote-status" data-type="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
