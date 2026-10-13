'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { smsHref, smsParts } from '@/lib/sms'

export type BookingRequestSummary = {
  id: string
  channel: 'email' | 'sms' | 'link'
  recipient_name: string | null
  recipient_email: string | null
  recipient_phone: string | null
  status: 'sent' | 'confirmed' | 'declined' | 'cancelled'
  slots: string[]
  chosen_start: string | null
  reply_message: string | null
  created_at: string
  expires_at: string
}

type Contact = { key: string; label: string; name: string; email: string; phone: string }

const melbourne = 'Australia/Melbourne'

function when(iso: string) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: melbourne,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(iso))
}

// datetime-local shows the browser's own time zone (the owner is in Victoria).
function toLocalInput(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

const CHANNEL_LABELS = { email: 'Emailed', sms: 'Text generated for', link: 'Link generated for' } as const

export function BookingPanel(props: {
  jobId: string
  service: string
  confirmedStart: string | null
  bookingNotifiedAt: string | null
  contacts: Contact[]
  requests: BookingRequestSummary[]
  tableMissing: boolean
}) {
  const router = useRouter()
  const base = `/api/admin/jobs/${props.jobId}`
  const form = useRef<HTMLFormElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [link, setLink] = useState<{ url: string; text: string; phone: string } | null>(null)
  const first = props.contacts[0]

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true)
    setMessage('')
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as {
      error?: string
      url?: string
      smsText?: string
      bookingEmail?: string
      bookingEmailError?: string
    }
    setBusy(false)
    return { ok: Boolean(response?.ok), ...result }
  }

  function applyContact(key: string) {
    const contact = props.contacts.find((item) => item.key === key)
    const elements = form.current?.elements
    if (!contact || !elements) return
    ;(elements.namedItem('recipientName') as HTMLInputElement).value = contact.name
    ;(elements.namedItem('recipientEmail') as HTMLInputElement).value = contact.email
    ;(elements.namedItem('recipientPhone') as HTMLInputElement).value = contact.phone
  }

  async function sendRequest(channel: 'email' | 'sms' | 'link') {
    const data = new FormData(form.current!)
    const slots = ['slot1', 'slot2', 'slot3']
      .map((name) => String(data.get(name) || ''))
      .filter(Boolean)
      .map((value) => new Date(value).toISOString())
    if (!slots.length) {
      setMessage('Choose at least one time to offer.')
      return
    }
    const phone = String(data.get('recipientPhone') || '').trim()
    const result = await call(`${base}/booking-request`, 'POST', {
      slots,
      channel,
      recipientName: String(data.get('recipientName') || '').trim(),
      recipientEmail: String(data.get('recipientEmail') || '').trim(),
      recipientPhone: phone,
      service: props.service,
    })
    if (!result.ok || !result.url) {
      setMessage(result.error || 'Could not create the request.')
      return
    }
    // A text is only generated here: the owner sends it from their phone.
    setLink({ url: result.url, text: result.smsText || '', phone })
    setMessage(
      channel === 'email'
        ? 'Times emailed.'
        : channel === 'sms'
          ? 'Text generated. Open it in your messages app or copy it, then send it.'
          : 'Link generated: copy it below.',
    )
    router.refresh()
  }

  async function saveManual(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = String(new FormData(event.currentTarget).get('bookedFor') || '')
    const result = await call(base, 'PATCH', { confirmedStart: value ? new Date(value).toISOString() : '' })
    if (!result.ok) {
      setMessage(result.error || 'Could not save.')
      return
    }
    setMessage(
      result.bookingEmail === 'sent'
        ? 'Saved. The date was emailed to the customer.'
        : result.bookingEmail === 'not_sent'
          ? `Saved, but the date email was not sent: ${result.bookingEmailError}`
          : 'Saved.',
    )
    router.refresh()
  }

  return (
    <div className="admin-step">
      <h4>3. Arrange a time</h4>

      <p>
        <strong>{props.confirmedStart ? `Booked: ${when(props.confirmedStart)}` : 'Not booked yet'}</strong>
        {props.bookingNotifiedAt && <span className="admin-muted"> · customer emailed the date</span>}
      </p>

      {props.requests.length > 0 && (
        <ul className="admin-booking-requests">
          {props.requests.map((request) => {
            const who = request.recipient_name || request.recipient_email || request.recipient_phone || 'contact'
            const expired = request.status === 'sent' && new Date(request.expires_at) < new Date()
            return (
              <li key={request.id}>
                <span>
                  {CHANNEL_LABELS[request.channel]} {who} · {when(request.created_at)} ·{' '}
                  {request.slots.map(when).join(' / ')}
                </span>
                <span>
                  {request.status === 'confirmed' && request.chosen_start ? (
                    <em className="good">Confirmed {when(request.chosen_start)}</em>
                  ) : request.status === 'declined' ? (
                    <em className="warn">None suit{request.reply_message ? `: “${request.reply_message}”` : ''}</em>
                  ) : request.status === 'cancelled' ? (
                    <em>Closed</em>
                  ) : expired ? (
                    <em>Expired</em>
                  ) : (
                    <>
                      <em>Waiting for reply</em>{' '}
                      <button
                        className="admin-button small"
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          const result = await call(`${base}/booking-request`, 'DELETE', { requestId: request.id })
                          setMessage(result.ok ? 'Request cancelled.' : result.error || 'Could not cancel.')
                          if (result.ok) router.refresh()
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {props.tableMissing ? (
        <p className="admin-muted">
          To send times by email or text, run the booking requests SQL in Supabase first (see
          BACKEND_SETUP.md). You can still enter an agreed time below.
        </p>
      ) : (
        <form ref={form} onSubmit={(event) => event.preventDefault()}>
          <p className="admin-muted">
            Offer up to three times. The message has a link: when they press a time, it is saved here
            and the customer is emailed the date (not the time).
          </p>
          {props.contacts.length > 1 && (
            <div className="admin-actions">
              <span className="admin-muted">Send to:</span>
              {props.contacts.map((contact) => (
                <button
                  key={contact.key}
                  className="admin-button small"
                  type="button"
                  onClick={() => applyContact(contact.key)}
                >
                  {contact.label}
                </button>
              ))}
            </div>
          )}
          <div className="admin-field-row">
            <label>
              Name
              <input name="recipientName" defaultValue={first?.name || ''} />
            </label>
            <label>
              Email
              <input name="recipientEmail" type="email" defaultValue={first?.email || ''} />
            </label>
            <label>
              Mobile
              <input name="recipientPhone" type="tel" defaultValue={first?.phone || ''} />
            </label>
          </div>
          <div className="admin-field-row">
            <label>
              Time 1
              <input name="slot1" type="datetime-local" step={900} />
            </label>
            <label>
              Time 2 (optional)
              <input name="slot2" type="datetime-local" step={900} />
            </label>
            <label>
              Time 3 (optional)
              <input name="slot3" type="datetime-local" step={900} />
            </label>
          </div>
          <div className="admin-actions">
            <button className="admin-button primary" type="button" disabled={busy} onClick={() => void sendRequest('email')}>
              Email times
            </button>
            <button className="admin-button primary" type="button" disabled={busy} onClick={() => void sendRequest('sms')}>
              Generate text
            </button>
            <button className="admin-button" type="button" disabled={busy} onClick={() => void sendRequest('link')}>
              Generate link only
            </button>
          </div>
          {link && (
            <div className="admin-secret">
              {link.text ? (
                <>
                  <p>{link.text}</p>
                  <p className="admin-muted">
                    {link.text.length} characters · {smsParts(link.text)} standard{' '}
                    {smsParts(link.text) === 1 ? 'text' : 'texts, delivered as one message'}
                  </p>
                  <div className="admin-actions">
                    {link.phone && (
                      <a className="admin-button primary" href={smsHref(link.phone, link.text)}>
                        Open in messages app
                      </a>
                    )}
                    <button
                      className="admin-button"
                      type="button"
                      onClick={() => void navigator.clipboard?.writeText(link.text).then(() => setMessage('Text copied.'))}
                    >
                      Copy text
                    </button>
                  </div>
                </>
              ) : (
                <code>{link.url}</code>
              )}
            </div>
          )}
        </form>
      )}

      <form className="admin-actions" onSubmit={saveManual}>
        <label className="admin-inline">
          Already agreed? Booked for
          <input
            key={props.confirmedStart || 'none'}
            name="bookedFor"
            type="datetime-local"
            step={900}
            defaultValue={toLocalInput(props.confirmedStart)}
          />
        </label>
        <button className="admin-button" type="submit" disabled={busy}>
          Save booked time
        </button>
        <button
          className="admin-button"
          type="button"
          disabled={busy || !props.confirmedStart}
          onClick={async () => {
            const result = await call(`${base}/booking-email`, 'POST')
            setMessage(result.ok ? 'Date emailed to the customer.' : result.error || 'Could not send.')
            if (result.ok) router.refresh()
          }}
        >
          Email the date again
        </button>
      </form>

      {message && <p className="admin-inline-message">{message}</p>}
    </div>
  )
}
