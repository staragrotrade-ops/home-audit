'use client'

import { useState } from 'react'

type Slot = { iso: string; label: string }

export function AgentResponse({ token, slots }: { token: string; slots: Slot[] }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<null | { confirmed: boolean; label?: string }>(null)
  const [error, setError] = useState('')
  const [showNote, setShowNote] = useState(false)

  async function send(body: Record<string, string>) {
    setBusy(true)
    setError('')
    const response = await fetch(`/api/booking/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as { error?: string }
    setBusy(false)
    if (!response?.ok) {
      setError(result.error || 'That did not go through. Please try again or call us.')
      return false
    }
    return true
  }

  if (done) {
    return (
      <div className="quote-status" data-type="success" role="status">
        {done.confirmed
          ? `Thank you. The inspection is booked for ${done.label}.`
          : 'Thank you. We have your note and will be in touch to find another time.'}
      </div>
    )
  }

  return (
    <div className="booking-response">
      <div className="booking-slots">
        {slots.map((slot) => (
          <button
            key={slot.iso}
            className="button"
            type="button"
            disabled={busy}
            onClick={async () => {
              if (await send({ action: 'confirm', slot: slot.iso })) setDone({ confirmed: true, label: slot.label })
            }}
          >
            Confirm {slot.label}
          </button>
        ))}
      </div>

      {!showNote ? (
        <button className="button button-secondary" type="button" disabled={busy} onClick={() => setShowNote(true)}>
          None of these work
        </button>
      ) : (
        <form
          className="order-details"
          onSubmit={async (event) => {
            event.preventDefault()
            const message = String(new FormData(event.currentTarget).get('message') || '')
            if (await send({ action: 'decline', message })) setDone({ confirmed: false })
          }}
        >
          <label htmlFor="booking-message">Suggest another time, or leave a note</label>
          <textarea id="booking-message" name="message" rows={3} maxLength={1000} />
          <button className="button" type="submit" disabled={busy}>
            Send
          </button>
        </form>
      )}

      {error && (
        <div className="quote-status" data-type="error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
