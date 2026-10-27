'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ACCESS_CHOICES, BUYER_SITUATIONS } from '@/lib/booking-options'

export function BookingDetailsForm({
  token,
  initial,
}: {
  token: string
  initial: {
    buyerSituation: string
    accessChoice: string
    otherName: string
    otherPhone: string
    agentName: string
    agentPhone: string
    agentEmail: string
  }
}) {
  const router = useRouter()
  const knownAgent = Boolean(initial.agentName || initial.agentPhone || initial.agentEmail)
  // Agent details given with the quote suggest the agent gives access.
  const [accessChoice, setAccessChoice] = useState(initial.accessChoice || (knownAgent ? 'agent' : ''))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setMessage(null)
    const response = await fetch(`/api/order/${token}/details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerSituation: form.get('buyerSituation'),
        accessChoice: form.get('accessChoice'),
        otherName: form.get('otherName') || '',
        otherPhone: form.get('otherPhone') || '',
        agentName: form.get('agentName') || '',
        agentPhone: form.get('agentPhone') || '',
        agentEmail: form.get('agentEmail') || '',
        notes: form.get('notes') || '',
      }),
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as { error?: string }
    setBusy(false)
    if (!response?.ok) {
      setMessage({ type: 'error', text: result.error || 'The details could not be saved.' })
      return
    }
    setMessage({ type: 'success', text: 'Thank you. We will arrange a time and email you the date.' })
    router.refresh()
  }

  return (
    <form className="order-details" onSubmit={submit}>
      <fieldset>
        <legend>Which of these applies to you? *</legend>
        {BUYER_SITUATIONS.map(([value, label]) => (
          <label key={value} className="checkbox-option">
            <input
              type="radio"
              name="buyerSituation"
              value={value}
              required
              defaultChecked={initial.buyerSituation === value}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Who should we contact to arrange access? *</legend>
        {ACCESS_CHOICES.map(([value, label]) => (
          <label key={value} className="checkbox-option">
            <input
              type="radio"
              name="accessChoice"
              value={value}
              required
              checked={accessChoice === value}
              onChange={() => setAccessChoice(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      {accessChoice === 'agent' && (
        <div className="field-grid">
          <p className="field-full order-hint">
            {knownAgent
              ? 'These are the agent details you gave us. Check them, or add any that are missing.'
              : 'We will find the agent on the listing. If you know their details, add them here.'}
          </p>
          <div className="field">
            <label htmlFor="agentName">Agent name</label>
            <input id="agentName" name="agentName" maxLength={120} defaultValue={initial.agentName} />
          </div>
          <div className="field">
            <label htmlFor="agentPhone">Agent phone</label>
            <input id="agentPhone" name="agentPhone" type="tel" maxLength={40} defaultValue={initial.agentPhone} />
          </div>
          <div className="field">
            <label htmlFor="agentEmail">Agent email</label>
            <input id="agentEmail" name="agentEmail" type="email" maxLength={180} defaultValue={initial.agentEmail} />
          </div>
        </div>
      )}

      {accessChoice === 'other' && (
        <div className="field-grid">
          <div className="field">
            <label htmlFor="otherName">Name *</label>
            <input id="otherName" name="otherName" required maxLength={120} defaultValue={initial.otherName} />
          </div>
          <div className="field">
            <label htmlFor="otherPhone">Phone *</label>
            <input
              id="otherPhone"
              name="otherPhone"
              type="tel"
              required
              maxLength={40}
              defaultValue={initial.otherPhone}
            />
          </div>
        </div>
      )}

      <div className="field-full">
        <label htmlFor="notes">Anything we should know about access?</label>
        <textarea id="notes" name="notes" maxLength={1000} />
      </div>

      {message && (
        <p className="quote-status" data-type={message.type} role={message.type === 'error' ? 'alert' : 'status'}>
          {message.text}
        </p>
      )}

      <button className="button" type="submit" disabled={busy}>
        {busy ? 'Saving…' : 'Save details'}
      </button>
    </form>
  )
}
