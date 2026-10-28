'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const METHODS: Record<string, string> = {
  bank_transfer: 'Bank transfer',
  cash: 'Cash',
  card: 'Card (in person)',
  other: 'Other',
}

// Payment received outside the website, marked by hand.
export function ManualPayment({
  jobId,
  total,
  paid,
  method,
  amount,
  reference,
  paidAt,
}: {
  jobId: string
  total: number | null
  paid: boolean
  method: string | null
  amount: number | null
  reference: string | null
  paidAt: string | null
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function send(body: unknown) {
    setBusy(true)
    setMessage('')
    const response = await fetch(`/api/admin/jobs/${jobId}/manual-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as { error?: string }
    setBusy(false)
    if (!response?.ok) {
      setMessage(result.error || 'Not saved.')
      return
    }
    router.refresh()
  }

  // Paid online (Stripe): nothing to do here.
  if (paid && !method) return null

  if (paid && method) {
    return (
      <p className="admin-actions">
        <span>
          Paid by {METHODS[method] || method}
          {amount != null ? ` · $${Number(amount).toFixed(2)}` : ''}
          {reference ? ` · ${reference}` : ''}
          {paidAt ? ` · ${new Date(paidAt).toLocaleDateString('en-AU', { timeZone: 'Australia/Melbourne' })}` : ''}
        </span>
        <button
          className="admin-button small"
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm('Mark this job as not paid?')) void send({ paid: false })
          }}
        >
          Undo
        </button>
        {message && <span className="admin-inline-message">{message}</span>}
      </p>
    )
  }

  return (
    <form
      className="admin-actions admin-manual-payment"
      onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        void send({
          paid: true,
          method: String(form.get('method')),
          amount: Number(form.get('amount')),
          reference: String(form.get('reference') || ''),
          paidOn: String(form.get('paidOn') || ''),
        })
      }}
    >
      <strong>Payment received outside the website:</strong>
      <select name="method" defaultValue="bank_transfer" aria-label="How it was paid">
        {Object.entries(METHODS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <input
        name="amount"
        type="number"
        min="0.01"
        step="0.01"
        required
        defaultValue={total ?? undefined}
        aria-label="Amount received ($)"
        placeholder="Amount $"
      />
      <input name="reference" maxLength={120} placeholder="Invoice / reference" aria-label="Reference" />
      <input name="paidOn" type="date" aria-label="Date paid" />
      <button className="admin-button small" type="submit" disabled={busy}>
        Mark as paid
      </button>
      {message && <span className="admin-inline-message">{message}</span>}
    </form>
  )
}
