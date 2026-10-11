'use client'

import { useEffect, useState } from 'react'
import { setAnalyticsExcluded } from '@/lib/visitor-analytics'

// Lets the owner stop their own visits being counted on this browser.
export function ExclusionToggle() {
  const [excluded, setExcluded] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/admin/analytics-exclusion', { cache: 'no-store' })
      .then((response) => response.json())
      .then((result: { excluded?: boolean }) => {
        const value = Boolean(result.excluded)
        setExcluded(value)
        setAnalyticsExcluded(value)
      })
      .catch(() => setExcluded(false))
  }, [])

  async function toggle() {
    if (excluded === null) return
    setBusy(true)
    const next = !excluded
    const response = await fetch('/api/admin/analytics-exclusion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excluded: next }),
    }).catch(() => null)
    if (response?.ok) {
      setExcluded(next)
      setAnalyticsExcluded(next)
    }
    setBusy(false)
  }

  return (
    <button className="admin-button small" type="button" onClick={toggle} disabled={busy || excluded === null}>
      {excluded ? 'This device: not counted ✓' : 'Stop counting this device'}
    </button>
  )
}
