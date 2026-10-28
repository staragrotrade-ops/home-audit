'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// A job taken by phone or in person: invoiced and paid outside the website.
export function NewJobForm({ translationFeeLabel }: { translationFeeLabel: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [created, setCreated] = useState<{ reference: string; url: string } | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const value = (name: string) => String(form.get(name) || '').trim()
    setBusy(true)
    setMessage('')
    const response = await fetch('/api/admin/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: value('firstName'),
        lastName: value('lastName'),
        email: value('email'),
        mobile: value('mobile'),
        address: value('address'),
        suburb: value('suburb'),
        postcode: value('postcode'),
        inspectionType: value('inspectionType'),
        price: Number(value('price')),
        preferredDate: value('preferredDate'),
        notes: value('notes'),
        translationZh: form.get('translationZh') === 'on',
      }),
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as {
      error?: string
      reference?: string
      url?: string
    }
    setBusy(false)
    if (!response?.ok || !result.url) {
      setMessage(result.error || 'The job could not be created. Check the details.')
      return
    }
    setCreated({ reference: result.reference || '', url: result.url })
    event.currentTarget.reset()
    router.refresh()
  }

  return (
    <details className="admin-new-job">
      <summary className="admin-button">+ New job (phone / in person)</summary>
      <form onSubmit={submit} className="admin-new-job-form">
        <p className="admin-muted">
          For jobs you invoice and collect yourself. Mark the payment on the job when it arrives; no Stripe
          payment, email or Xero invoice is sent automatically.
        </p>
        <div className="admin-new-job-grid">
          <label>
            First name *
            <input name="firstName" required maxLength={60} />
          </label>
          <label>
            Last name
            <input name="lastName" maxLength={60} />
          </label>
          <label>
            Email *
            <input name="email" type="email" required maxLength={160} />
          </label>
          <label>
            Mobile
            <input name="mobile" type="tel" maxLength={20} />
          </label>
          <label className="wide">
            Property address *
            <input name="address" required maxLength={200} placeholder="12 Example Street" />
          </label>
          <label>
            Suburb
            <input name="suburb" maxLength={80} />
          </label>
          <label>
            Postcode
            <input name="postcode" inputMode="numeric" pattern="\d{4}" maxLength={4} />
          </label>
          <label>
            Inspection
            <select name="inspectionType" defaultValue="building_and_pest">
              <option value="building_and_pest">Building &amp; pest</option>
              <option value="building_only">Building only</option>
              <option value="pre_auction">Pre-auction</option>
            </select>
          </label>
          <label>
            Price incl. GST ($) *
            <input name="price" type="number" min="1" step="0.01" required />
          </label>
          <label>
            Preferred date
            <input name="preferredDate" type="date" />
          </label>
          <label className="checkbox wide">
            <input name="translationZh" type="checkbox" /> Chinese translation (+{translationFeeLabel}, added to the
            price)
          </label>
          <label className="wide">
            Notes
            <textarea name="notes" rows={2} maxLength={2000} />
          </label>
        </div>
        <button className="admin-button" type="submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create job'}
        </button>
        {message && <span className="admin-inline-message">{message}</span>}
        {created && (
          <p className="admin-note">
            Created {created.reference}. Send the customer this link to accept the Inspection Agreement (they can
            also pay online there if they want):{' '}
            <a href={created.url} target="_blank" rel="noreferrer">
              {created.url}
            </a>
          </p>
        )}
      </form>
    </details>
  )
}
