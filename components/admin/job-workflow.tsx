'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { BookingPanel, type BookingRequestSummary } from '@/components/admin/booking-panel'
import { agentSms, reviewRequestSms } from '@/lib/order-emails'
import { isRedirectLink } from '@/lib/listing-url'
import { smsHref } from '@/lib/sms'

type Props = {
  jobId: string
  paid: boolean
  quoteStatus: string
  address: string
  service: string
  dateHint: string
  customerFirstName: string
  customerName: string
  customerMobile: string
  confirmedStart: string | null
  bookingNotifiedAt: string | null
  reviewRequestedAt: string | null
  agentTextedAt: string | null
  bookingRequests: BookingRequestSummary[]
  bookingTableMissing: boolean
  accessOther: { name: string; phone: string } | null
  reviewUrl: string
  agent: {
    name: string
    agency: string
    phone: string
    email: string
    listingUrl: string
    priceGuide: string
    checked: boolean
  }
}

async function call(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => null)
  const result = ((await response?.json().catch(() => ({}))) || {}) as {
    error?: string
    url?: string
    emailed?: boolean
  }
  return { ok: Boolean(response?.ok), ...result }
}

export function JobWorkflow(props: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')
  const base = `/api/admin/jobs/${props.jobId}`
  const agentForm = useRef<HTMLFormElement>(null)
  const [lookup, setLookup] = useState<null | {
    confidence: string
    notes: string
    sources: { title: string; url: string }[]
  }>(null)

  // Fills the listing and agent fields from Google AI. Nothing is saved
  // until the owner checks the details and presses Save.
  async function findAgent() {
    setBusy(true)
    setMessage('Searching… this can take up to 30 seconds.')
    setLookup(null)
    const response = await fetch(`${base}/find-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(() => null)
    const data = ((await response?.json().catch(() => ({}))) || {}) as {
      error?: string
      result?: {
        agentName: string
        agency: string
        mobile: string
        email: string
        priceGuide: string
        listingUrl: string
        confidence: string
        notes: string
        sources: { title: string; url: string }[]
      }
    }
    setBusy(false)
    if (!response?.ok || !data.result) {
      setMessage(data.error || 'The lookup did not work. Try "Ask Google AI for agent" instead.')
      return
    }
    const result = data.result
    const form = agentForm.current
    const fill = (name: string, value: string) => {
      const input = form?.elements.namedItem(name) as HTMLInputElement | null
      if (input && value) input.value = value
    }
    fill('agentName', result.agentName)
    fill('agentAgency', result.agency)
    fill('agentPhone', result.mobile)
    fill('agentEmail', result.email)
    fill('priceGuide', result.priceGuide)
    fill('listingUrl', result.listingUrl)
    setLookup({ confidence: result.confidence, notes: result.notes, sources: result.sources })
    setMessage(
      result.agentName || result.mobile
        ? 'Filled in from Google AI. Check the details, then press Save.'
        : 'Google AI did not find the agent. Try "Ask Google AI for agent" or the listing.',
    )
  }

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, done: string) {
    setBusy(true)
    setMessage('')
    const result = await action()
    setBusy(false)
    setMessage(result.ok ? done : result.error || 'Something went wrong.')
    if (result.ok) router.refresh()
  }

  async function sendQuote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const price = Number(new FormData(event.currentTarget).get('price'))
    setBusy(true)
    setMessage('')
    const result = await call(`${base}/quote`, 'POST', { priceExGst: price, sendEmail: true })
    setBusy(false)
    if (!result.ok) {
      setMessage(result.error || 'Could not send the quote.')
      return
    }
    setLink(result.url || '')
    setMessage(result.emailed ? 'Quote emailed to the customer.' : 'Quote saved. Email not sent: copy the link below.')
    router.refresh()
  }

  async function saveAgent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await run(
      () =>
        call(base, 'PATCH', {
          agentName: String(form.get('agentName') || ''),
          agentAgency: String(form.get('agentAgency') || ''),
          agentPhone: String(form.get('agentPhone') || ''),
          agentEmail: String(form.get('agentEmail') || ''),
          listingUrl: String(form.get('listingUrl') || ''),
          listingPriceGuide: String(form.get('priceGuide') || ''),
          listingChecked: form.get('checked') === 'on',
        }),
      'Agent details saved.',
    )
  }

  const agentText = agentSms({
    agentName: props.agent.name,
    buyerName: props.customerName,
    address: props.address,
    dateHint: props.dateHint,
    service: props.service,
  })
  const reviewText = props.reviewUrl ? reviewRequestSms(props.customerFirstName, props.reviewUrl) : ''

  return (
    <div className="admin-workflow">
      {!props.paid && (
        <form className="admin-step" onSubmit={sendQuote}>
          <h4>{props.quoteStatus === 'quoted' ? '1. Change the price' : '1. Price review'}</h4>
          <div className="admin-actions">
            <label className="admin-inline">
              Price ex GST $
              <input name="price" type="number" min={50} max={20000} step={1} defaultValue={500} required />
            </label>
            <button className="admin-button primary" type="submit" disabled={busy}>
              {props.quoteStatus === 'quoted' ? 'Send new price to customer' : 'Send quote to customer'}
            </button>
          </div>
                {lookup && (
          <div className="admin-lookup">
            <p>
              Confidence: <strong>{lookup.confidence}</strong>
              {lookup.notes ? ` · ${lookup.notes}` : ''}
            </p>
            {lookup.sources.length > 0 && (
              <ul>
                {lookup.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noreferrer">
                      {source.title || 'Source'}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
      )}

      <form className="admin-step" onSubmit={saveAgent} ref={agentForm}>
        <h4>{props.paid ? '2. Listing and agent' : 'Listing and agent'}</h4>
        <div className="admin-field-row">
          <label>
            Listing link
            <input name="listingUrl" type="url" defaultValue={props.agent.listingUrl} />
            {isRedirectLink(props.agent.listingUrl) && (
              <small className="admin-muted">
                This is a Google redirect link from the customer, not the listing itself. Press &quot;Find
                agent automatically&quot; to fill in the real link.
              </small>
            )}
          </label>
          <label>
            Price guide on listing
            <input name="priceGuide" defaultValue={props.agent.priceGuide} placeholder="e.g. $1.1m – $1.2m" />
          </label>
          <label>
            Agent name
            <input name="agentName" defaultValue={props.agent.name} />
          </label>
          <label>
            Agency
            <input name="agentAgency" defaultValue={props.agent.agency} />
          </label>
          <label>
            Agent mobile
            <input name="agentPhone" type="tel" defaultValue={props.agent.phone} />
          </label>
          <label>
            Agent email
            <input name="agentEmail" type="email" defaultValue={props.agent.email} />
          </label>
        </div>
        <label className="admin-check">
          <input type="checkbox" name="checked" defaultChecked={props.agent.checked} /> Price guide checked
          against the listing
        </label>
        <div className="admin-actions">
          <button className="admin-button" type="submit" disabled={busy}>
            Save
          </button>
          <button className="admin-button primary" type="button" disabled={busy} onClick={() => void findAgent()}>
            Find agent automatically
          </button>
          {props.agent.listingUrl && (
            <a className="admin-button" href={props.agent.listingUrl} target="_blank" rel="noreferrer">
              Open listing
            </a>
          )}
          {/* Opens Google's AI Mode with the question filled in; it searches the
              web and answers with the agent's details and sources. */}
          <a
            className="admin-button"
            target="_blank"
            rel="noreferrer"
            href={`https://www.google.com/search?udm=50&q=${encodeURIComponent(
              `Who is the selling real estate agent for ${props.address}, Victoria? ` +
                "Give the agent's name, agency, mobile number and email, and the price guide " +
                '(check the Statement of Information for the indicative selling price).',
            )}`}
          >
            Ask Google AI for agent
          </a>
          {props.agent.phone && (
            <a
              className="admin-button primary"
              href={smsHref(props.agent.phone, agentText)}
              onClick={() => void call(base, 'PATCH', { agentTexted: true }).then(() => router.refresh())}
            >
              Text agent
            </a>
          )}
          {props.agentTextedAt && <span className="admin-inline-message">Texted</span>}
        </div>
      </form>

      {props.paid && (
        <BookingPanel
          jobId={props.jobId}
          service={props.service}
          confirmedStart={props.confirmedStart}
          bookingNotifiedAt={props.bookingNotifiedAt}
          requests={props.bookingRequests}
          tableMissing={props.bookingTableMissing}
          contacts={[
            {
              key: 'agent',
              label: 'Agent',
              name: props.agent.name,
              email: props.agent.email,
              phone: props.agent.phone,
            },
            ...(props.accessOther
              ? [{ key: 'other', label: 'Customer’s access contact', name: props.accessOther.name, email: '', phone: props.accessOther.phone }]
              : []),
          ]}
        />
      )}

      {props.paid && (
        <div className="admin-step">
          <h4>4. After the report: Google review</h4>
          <div className="admin-actions">
            <button
              className="admin-button"
              type="button"
              disabled={busy || !props.reviewUrl}
              onClick={() =>
                void run(() => call(`${base}/review-request`, 'POST', { channel: 'email' }), 'Review request emailed.')
              }
            >
              Email review request
            </button>
            {props.customerMobile && reviewText && (
              <a
                className="admin-button"
                href={smsHref(props.customerMobile, reviewText)}
                onClick={() => void call(`${base}/review-request`, 'POST', { channel: 'sms' }).then(() => router.refresh())}
              >
                Text review request
              </a>
            )}
            {props.reviewRequestedAt && <span className="admin-inline-message">Requested</span>}
            {!props.reviewUrl && <span className="admin-inline-message">Set GOOGLE_REVIEW_URL first</span>}
          </div>
        </div>
      )}

      <div className="admin-actions">
        <button
          className="admin-button small"
          type="button"
          disabled={busy}
          onClick={async () => {
            const result = await call(`${base}/order-link`, 'POST')
            if (result.ok && result.url) setLink(result.url)
            else setMessage(result.error || 'Could not create a link.')
          }}
        >
          Customer order link
        </button>
        {message && <span className="admin-inline-message">{message}</span>}
      </div>
      {link && (
        <p className="admin-secret">
          <code>{link}</code>
        </p>
      )}
    </div>
  )
}
