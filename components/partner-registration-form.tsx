'use client'

import { useState } from 'react'
import { Turnstile } from '@/components/turnstile'
import { REFERRER_TYPES } from '@/lib/referrals'

export function PartnerRegistrationForm({ turnstileSiteKey }: { turnstileSiteKey: string }) {
  const [busy, setBusy] = useState(false)
  const [token, setToken] = useState('')
  const [resetKey, setResetKey] = useState(0)
  const [done, setDone] = useState<null | 'new' | 'existing'>(null)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError('')
    const response = await fetch('/api/referrers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrerType: form.get('referrerType'),
        name: form.get('name') || '',
        agency: form.get('agency') || '',
        branch: form.get('branch') || '',
        mobile: form.get('mobile') || '',
        email: form.get('email') || '',
        notes: form.get('notes') || '',
        agree: form.get('agree') === 'on',
        turnstileToken: token,
        website: form.get('website') || '',
      }),
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as { error?: string; alreadyRegistered?: boolean }
    setBusy(false)
    if (!response?.ok) {
      setError(result.error || 'That did not go through. Please try again or email us.')
      setResetKey((key) => key + 1)
      return
    }
    setDone(result.alreadyRegistered ? 'existing' : 'new')
  }

  if (done) {
    return (
      <div className="quote-status" data-type="success" role="status">
        {done === 'new'
          ? 'Thank you. We will check your details and email you your referral link once approved.'
          : 'This email address is already registered. We will be in touch if anything is needed.'}
      </div>
    )
  }

  return (
    <form className="partner-form" onSubmit={submit}>
      <div className="field-full">
        <label htmlFor="referrerType">I am a *</label>
        <select id="referrerType" name="referrerType" required defaultValue="conveyancer_solicitor">
          {REFERRER_TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="field-full">
        <label htmlFor="name">Your name *</label>
        <input id="name" name="name" required minLength={2} maxLength={120} autoComplete="name" />
      </div>
      <div className="field-full">
        <label htmlFor="agency">Business name</label>
        <input id="agency" name="agency" maxLength={160} autoComplete="organization" />
      </div>
      <div className="field-full">
        <label htmlFor="branch">Office or suburb</label>
        <input id="branch" name="branch" maxLength={160} />
      </div>
      <div className="field-full">
        <label htmlFor="mobile">Mobile *</label>
        <input id="mobile" name="mobile" type="tel" required minLength={8} maxLength={30} autoComplete="tel" />
      </div>
      <div className="field-full">
        <label htmlFor="email">Email *</label>
        <input id="email" name="email" type="email" required maxLength={180} autoComplete="email" />
      </div>
      <div className="field-full">
        <label htmlFor="notes">Anything we should know (optional)</label>
        <textarea id="notes" name="notes" rows={3} maxLength={1000} />
      </div>
      <input className="visually-hidden" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" />
      <label className="checkbox-option">
        <input type="checkbox" name="agree" required /> The details above are correct, and Home Audit may
        contact me about referrals.
      </label>
      {turnstileSiteKey && (
        <Turnstile siteKey={turnstileSiteKey} action="partner" onToken={setToken} resetKey={resetKey} />
      )}
      <button className="button" type="submit" disabled={busy || (Boolean(turnstileSiteKey) && !token)}>
        {busy ? 'Sending…' : 'Register'}
      </button>
      {error && (
        <div className="quote-status" data-type="error" role="alert">
          {error}
        </div>
      )}
    </form>
  )
}
