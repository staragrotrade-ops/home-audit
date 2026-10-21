'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { JOB_STATUSES, JOB_STATUS_LABELS, type JobStatus } from '@/lib/job-status'

type StaffOption = { id: string; display_name: string; active: boolean }

export function JobEditor({
  jobId,
  status,
  staffId,
  staff,
  archived,
  isTest,
  internalNotes,
}: {
  jobId: string
  status: JobStatus
  staffId: string
  staff: StaffOption[]
  archived: boolean
  isTest: boolean
  internalNotes: string
}) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function save(body: Record<string, unknown>) {
    setBusy(true)
    setMessage('')
    const response = await fetch(`/api/admin/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)
    const result = (await response?.json().catch(() => ({}))) as
      | { error?: string; bookingEmail?: string; bookingEmailError?: string }
      | undefined
    setBusy(false)
    if (!response?.ok) {
      setMessage(result?.error || 'Could not save.')
      return
    }
    setMessage(
      result?.bookingEmail === 'sent'
        ? 'Saved. The date was emailed to the customer.'
        : result?.bookingEmail === 'not_sent'
          ? `Saved, but the date email was not sent: ${result.bookingEmailError}`
          : 'Saved',
    )
    router.refresh()
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    // Send the status only if it was changed here. The page may have been
    // opened before a payment or booking moved the status on; re-sending the
    // old value would put it back (HA-20261021-C4CE16, 22 Oct 2026).
    const chosenStatus = String(form.get('status') || '')
    void save({
      ...(chosenStatus && chosenStatus !== status ? { status: chosenStatus } : {}),
      staffId: String(form.get('staffId') || ''),
      internalNotes: String(form.get('internalNotes') || ''),
    })
  }

  return (
    <form className="admin-job-editor" onSubmit={onSubmit}>
      <div className="admin-field-row">
        <label>
          Status
          <select name="status" defaultValue={status}>
            {JOB_STATUSES.map((value) => (
              <option key={value} value={value}>
                {JOB_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Inspector
          <select name="staffId" defaultValue={staffId}>
            <option value="">Not assigned</option>
            {staff
              .filter((member) => member.active || member.id === staffId)
              .map((member) => (
                <option key={member.id} value={member.id}>
                  {member.display_name}
                </option>
              ))}
          </select>
        </label>
      </div>
      <label>
        Internal notes
        <textarea name="internalNotes" rows={3} defaultValue={internalNotes} maxLength={4000} />
      </label>
      <div className="admin-actions">
        <button className="admin-button primary" type="submit" disabled={busy}>
          Save
        </button>
        <button
          className="admin-button"
          type="button"
          disabled={busy}
          onClick={() => void save({ archived: !archived })}
        >
          {archived ? 'Restore' : 'Archive'}
        </button>
        <button
          className="admin-button"
          type="button"
          disabled={busy}
          onClick={() => void save({ isTest: !isTest })}
        >
          {isTest ? 'Not a test' : 'Mark as test'}
        </button>
        {message && <span className="admin-inline-message">{message}</span>}
      </div>
    </form>
  )
}
