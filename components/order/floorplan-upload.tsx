'use client'

import { useState } from 'react'

// Optional step after payment: the floorplan from the listing helps the
// inspector mark exactly where each issue is in the report.
export function FloorplanUpload({ token, existing }: { token: string; existing: number }) {
  const [count, setCount] = useState(existing)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(form: HTMLFormElement) {
    setBusy(true)
    setMessage('Uploading…')
    const response = await fetch(`/api/order/${token}/floorplan`, { method: 'POST', body: new FormData(form) }).catch(
      () => null,
    )
    const result = ((await response?.json().catch(() => null)) || {}) as { error?: string }
    setBusy(false)
    if (response?.ok) {
      setCount((value) => value + 1)
      setMessage('Thanks – the floorplan is with your inspector.')
      form.reset()
    } else {
      setMessage(result.error || 'The upload did not work. You can email the floorplan instead.')
    }
  }

  return (
    <form
      className="order-floorplan"
      onSubmit={(event) => {
        event.preventDefault()
        void submit(event.currentTarget)
      }}
    >
      <p className="order-hint">
        {count > 0
          ? `We have ${count} floorplan${count > 1 ? 's' : ''} for this property. Add another level if there is one.`
          : 'Optional: if the listing has a floorplan, save it (a screenshot is fine) and upload it here. Your report will show where each issue was found.'}
      </p>
      <label>
        Floorplan (JPG, PNG, WebP or PDF, up to 4 MB)
        <input type="file" name="file" accept="image/jpeg,image/png,image/webp,application/pdf" required />
      </label>
      <label>
        Level <span className="order-hint">(optional)</span>
        <input type="text" name="level" maxLength={60} placeholder="e.g. Ground floor" />
      </label>
      <button className="button" type="submit" disabled={busy}>
        Upload floorplan
      </button>
      {message && <p className="order-hint" role="status">{message}</p>}
    </form>
  )
}
