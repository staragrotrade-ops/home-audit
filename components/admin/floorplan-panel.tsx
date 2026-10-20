'use client'

import { useCallback, useState } from 'react'

type Floorplan = {
  id: string
  level_label: string
  content_type: string
  size_bytes: number
  source: 'listing' | 'customer' | 'admin' | 'onsite'
  url: string | null
}

type FetchState = {
  listing_url: string | null
  floorplan_fetch_status: string | null
  floorplan_fetch_at: string | null
  floorplan_fetch_note: string | null
} | null

const SOURCE: Record<Floorplan['source'], string> = {
  listing: 'from listing',
  customer: 'uploaded by customer',
  admin: 'uploaded by admin',
  onsite: 'captured onsite',
}

// Floorplans the inspector app will pin defects on. Loaded when opened so the
// job list stays fast.
export function FloorplanPanel({ jobId, hasListing }: { jobId: string; hasListing: boolean }) {
  const [loaded, setLoaded] = useState(false)
  const [plans, setPlans] = useState<Floorplan[]>([])
  const [fetchState, setFetchState] = useState<FetchState>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/jobs/${jobId}/floorplans`).catch(() => null)
    const result = (await response?.json().catch(() => null)) as
      | { ok: boolean; floorplans?: Floorplan[]; fetch?: FetchState; error?: string }
      | null
    if (!response?.ok || !result?.ok) {
      setMessage(result?.error || 'Floorplans could not be loaded.')
      return
    }
    setPlans(result.floorplans || [])
    setFetchState(result.fetch || null)
    setLoaded(true)
  }, [jobId])

  async function run(action: () => Promise<Response | null>, pending: string) {
    setBusy(true)
    setMessage(pending)
    const response = await action()
    const result = (await response?.json().catch(() => null)) as
      | { ok: boolean; error?: string; result?: { note: string } }
      | null
    setBusy(false)
    setMessage(response?.ok ? result?.result?.note || 'Saved.' : result?.error || 'That did not work.')
    await load()
  }

  function upload(form: HTMLFormElement) {
    const data = new FormData(form)
    void run(
      () => fetch(`/api/admin/jobs/${jobId}/floorplans`, { method: 'POST', body: data }).catch(() => null),
      'Uploading…',
    ).then(() => form.reset())
  }

  return (
    <details
      className="admin-subdetails"
      onToggle={(event) => {
        if ((event.currentTarget as HTMLDetailsElement).open && !loaded) void load()
      }}
    >
      <summary>Floorplan for the inspector app{loaded ? ` (${plans.length})` : ''}</summary>
      {fetchState?.floorplan_fetch_status && (
        <p className="admin-note">
          Listing check: {fetchState.floorplan_fetch_status.replace('_', ' ')}
          {fetchState.floorplan_fetch_note ? ` – ${fetchState.floorplan_fetch_note}` : ''}
        </p>
      )}
      {plans.length > 0 && (
        <ul className="admin-floorplans">
          {plans.map((plan) => (
            <li key={plan.id}>
              {plan.url && plan.content_type.startsWith('image/') ? (
                <a href={plan.url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={plan.url} alt={`${plan.level_label} floorplan`} />
                </a>
              ) : (
                plan.url && <a href={plan.url} target="_blank" rel="noreferrer">Open PDF</a>
              )}
              <span>
                {plan.level_label} · {SOURCE[plan.source]}{' '}
                <button
                  className="admin-button small"
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void run(
                      () =>
                        fetch(`/api/admin/jobs/${jobId}/floorplans?floorplanId=${plan.id}`, { method: 'DELETE' }).catch(
                          () => null,
                        ),
                      'Removing…',
                    )
                  }
                >
                  Remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <form
        className="admin-actions"
        onSubmit={(event) => {
          event.preventDefault()
          upload(event.currentTarget)
        }}
      >
        <input type="file" name="file" accept="image/jpeg,image/png,image/webp,application/pdf" required />
        <input type="text" name="level" placeholder="Level (e.g. Ground floor)" maxLength={60} />
        <button className="admin-button small" type="submit" disabled={busy}>
          Upload floorplan
        </button>
        {hasListing && (
          <button
            className="admin-button small"
            type="button"
            disabled={busy}
            onClick={() =>
              void run(
                () =>
                  fetch(`/api/admin/jobs/${jobId}/floorplans?action=fetch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: '{}',
                  }).catch(() => null),
                'Checking the listing…',
              )
            }
          >
            Try the listing again
          </button>
        )}
      </form>
      {message && <p className="admin-inline-message">{message}</p>}
    </details>
  )
}
