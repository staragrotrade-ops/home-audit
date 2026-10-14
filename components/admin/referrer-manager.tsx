'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  commissionLabel,
  REFERRER_TYPES,
  referralLink,
  referralQrUrl,
  referrerTypeLabel,
  type ReferrerRecord,
} from '@/lib/referrals'

async function call(method: string, body: unknown) {
  const response = await fetch('/api/admin/referrers', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null)
  const result = ((await response?.json().catch(() => ({}))) || {}) as { error?: string }
  return { ok: Boolean(response?.ok), error: result.error }
}

function CommissionFields({ type, value }: { type?: string | null; value?: string }) {
  return (
    <>
      <label>
        Commission
        <select name="commissionType" defaultValue={type || ''}>
          <option value="">None</option>
          <option value="fixed">Fixed $ per paid job</option>
          <option value="percent">% of fee (excl. GST)</option>
        </select>
      </label>
      <label>
        Amount ($ or %)
        <input name="commissionValue" inputMode="decimal" defaultValue={value || ''} placeholder="e.g. 50 or 10" />
      </label>
    </>
  )
}

function commissionValueOf(referrer: ReferrerRecord) {
  if (referrer.commission_type === 'fixed' && referrer.commission_cents != null) {
    return String(Number(referrer.commission_cents) / 100)
  }
  if (referrer.commission_type === 'percent' && referrer.commission_percent != null) {
    return String(Number(referrer.commission_percent))
  }
  return ''
}

export function ReferrerManager({ referrers, siteUrl }: { referrers: ReferrerRecord[]; siteUrl: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState('')

  async function run(action: () => Promise<{ ok: boolean; error?: string }>, done: string) {
    setBusy(true)
    setMessage('')
    const result = await action()
    setBusy(false)
    setMessage(result.ok ? done : result.error || 'Something went wrong.')
    if (result.ok) router.refresh()
    return result.ok
  }

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const ok = await run(
      () =>
        call('POST', {
          referrerType: form.get('referrerType'),
          name: String(form.get('name') || ''),
          agency: String(form.get('agency') || ''),
          branch: String(form.get('branch') || ''),
          mobile: String(form.get('mobile') || ''),
          email: String(form.get('email') || ''),
          notes: String(form.get('notes') || ''),
          commissionType: String(form.get('commissionType') || ''),
          commissionValue: String(form.get('commissionValue') || ''),
        }),
      'Referrer added. Copy their link below.',
    )
    if (ok) formElement.reset()
  }

  const pending = referrers.filter((r) => r.status === 'pending')

  return (
    <div className="admin-referrers">
      {pending.length > 0 && (
        <p className="admin-message">
          {pending.length} registration{pending.length === 1 ? '' : 's'} waiting for approval.
        </p>
      )}

      {referrers.length === 0 ? (
        <p className="admin-muted">No referrers yet. Add one below, or they can register at /partners/register.</p>
      ) : (
        <ul className="admin-referrer-list">
          {referrers.map((referrer) => {
            const link = referralLink(siteUrl, referrer.ref_code)
            return (
              <li key={referrer.id}>
                <div className="admin-referrer-head">
                  <strong>{referrer.name}</strong>
                  {referrer.agency && <span>{[referrer.agency, referrer.branch].filter(Boolean).join(' ')}</span>}
                  <span className="admin-badges">
                    <em>{referrerTypeLabel(referrer.referrer_type)}</em>
                    <em className={referrer.status === 'active' ? 'good' : referrer.status === 'pending' ? 'warn' : ''}>
                      {referrer.status === 'active' ? 'Active' : referrer.status === 'pending' ? 'Waiting for approval' : 'Disabled'}
                    </em>
                    {referrer.source === 'self' && <em>Registered online</em>}
                  </span>
                </div>
                <div className="admin-muted">
                  {[referrer.mobile, referrer.email].filter(Boolean).join(' · ')}
                  {referrer.notes ? ` · ${referrer.notes}` : ''}
                </div>
                <div className="admin-actions">
                  <code>{link}</code>
                  <button
                    className="admin-button small"
                    type="button"
                    onClick={() => void navigator.clipboard?.writeText(link).then(() => setMessage('Link copied.'))}
                  >
                    Copy link
                  </button>
                  <a className="admin-button small" href={referralQrUrl(link)} target="_blank" rel="noreferrer">
                    QR code
                  </a>
                  <span>{commissionLabel(referrer)}</span>
                  <button className="admin-button small" type="button" onClick={() => setEditing(editing === referrer.id ? '' : referrer.id)}>
                    Change commission
                  </button>
                  {referrer.status !== 'active' && (
                    <button
                      className="admin-button small primary"
                      type="button"
                      disabled={busy}
                      onClick={() => void run(() => call('PATCH', { action: 'status', id: referrer.id, status: 'active' }), `${referrer.name} approved.`)}
                    >
                      {referrer.status === 'pending' ? 'Approve' : 'Turn back on'}
                    </button>
                  )}
                  {referrer.status !== 'disabled' && (
                    <button
                      className="admin-button small"
                      type="button"
                      disabled={busy}
                      onClick={() => void run(() => call('PATCH', { action: 'status', id: referrer.id, status: 'disabled' }), `${referrer.name} disabled.`)}
                    >
                      Disable
                    </button>
                  )}
                </div>
                {editing === referrer.id && (
                  <form
                    className="admin-actions"
                    onSubmit={async (event) => {
                      event.preventDefault()
                      const form = new FormData(event.currentTarget)
                      const ok = await run(
                        () =>
                          call('PATCH', {
                            action: 'commission',
                            id: referrer.id,
                            commissionType: String(form.get('commissionType') || ''),
                            commissionValue: String(form.get('commissionValue') || ''),
                          }),
                        'Commission saved.',
                      )
                      if (ok) setEditing('')
                    }}
                  >
                    <CommissionFields type={referrer.commission_type} value={commissionValueOf(referrer)} />
                    <button className="admin-button small primary" type="submit" disabled={busy}>
                      Save
                    </button>
                  </form>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <details className="admin-subdetails">
        <summary>Add a referrer</summary>
        <form className="admin-step" onSubmit={add}>
          <div className="admin-field-row">
            <label>
              Type
              <select name="referrerType" defaultValue="conveyancer_solicitor">
                {REFERRER_TYPES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Name *
              <input name="name" required minLength={2} maxLength={120} />
            </label>
            <label>
              Business
              <input name="agency" maxLength={160} />
            </label>
            <label>
              Office or suburb
              <input name="branch" maxLength={160} />
            </label>
            <label>
              Mobile
              <input name="mobile" type="tel" maxLength={30} />
            </label>
            <label>
              Email
              <input name="email" type="email" maxLength={180} />
            </label>
            <CommissionFields />
          </div>
          <label>
            Notes
            <textarea name="notes" rows={2} maxLength={1000} />
          </label>
          <div className="admin-actions">
            <button className="admin-button primary" type="submit" disabled={busy}>
              Add referrer
            </button>
          </div>
        </form>
      </details>

      {message && <p className="admin-inline-message">{message}</p>}
    </div>
  )
}
