'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Sets who referred a job: follow the referral link, a referrer chosen by the
// owner (for phoned-in referrals), or nobody.
export function JobReferrerSelect({
  jobId,
  value,
  options,
}: {
  jobId: string
  value: string
  options: { id: string; label: string }[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  return (
    <span className="admin-inline">
      <select
        aria-label="Referred by"
        defaultValue={value}
        disabled={busy}
        onChange={async (event) => {
          setBusy(true)
          setMessage('')
          const response = await fetch(`/api/admin/jobs/${jobId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ referrer: event.target.value }),
          }).catch(() => null)
          setBusy(false)
          setMessage(response?.ok ? 'Saved' : 'Could not save')
          if (response?.ok) router.refresh()
        }}
      >
        <option value="link">From referral link</option>
        <option value="none">Not referred</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {message && <span className="admin-inline-message">{message}</span>}
    </span>
  )
}
