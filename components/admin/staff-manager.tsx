'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Member = {
  id: string
  email: string
  display_name: string
  role: string
  active: boolean
  registration_number: string | null
}

async function send(url: string, method: string, body: unknown) {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null)
  const result = ((await response?.json().catch(() => ({}))) || {}) as {
    error?: string
    temporaryPassword?: string
    email?: string
  }
  return { ok: Boolean(response?.ok), ...result }
}

export function StaffManager({ staff }: { staff: Member[] }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState(false)

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setBusy(true)
    setSecret('')
    const result = await send('/api/admin/staff', 'POST', {
      email: form.get('email'),
      displayName: form.get('displayName'),
      role: form.get('role'),
      registrationNumber: form.get('registrationNumber'),
    })
    setBusy(false)
    if (!result.ok) {
      setMessage(result.error || 'Could not create the login.')
      return
    }
    formElement.reset()
    setMessage(`Login created for ${result.email}.`)
    setSecret(result.temporaryPassword || '')
    router.refresh()
  }

  async function update(id: string, body: Record<string, unknown>) {
    setBusy(true)
    setSecret('')
    const result = await send(`/api/admin/staff/${id}`, 'PATCH', body)
    setBusy(false)
    if (!result.ok) {
      setMessage(result.error || 'Could not update.')
      return
    }
    setMessage(result.temporaryPassword ? 'Password reset.' : 'Saved.')
    setSecret(result.temporaryPassword || '')
    router.refresh()
  }

  return (
    <div className="admin-staff">
      {staff.length === 0 ? (
        <p className="admin-muted">No inspector logins yet.</p>
      ) : (
        <ul className="admin-staff-list">
          {staff.map((member) => (
            <li key={member.id}>
              <div>
                <strong>{member.display_name}</strong>
                <span>
                  {member.email} · {member.role}
                  {member.registration_number ? ` · ${member.registration_number}` : ''}
                  {member.active ? '' : ' · disabled'}
                </span>
              </div>
              <div className="admin-actions">
                <button
                  className="admin-button small"
                  type="button"
                  disabled={busy}
                  onClick={() => void update(member.id, { resetPassword: true })}
                >
                  Reset password
                </button>
                <button
                  className="admin-button small"
                  type="button"
                  disabled={busy}
                  onClick={() => void update(member.id, { active: !member.active })}
                >
                  {member.active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="admin-staff-form" onSubmit={create}>
        <h3>Add an inspector login</h3>
        <div className="admin-field-row">
          <label>
            Name
            <input name="displayName" required minLength={2} maxLength={80} />
          </label>
          <label>
            Email
            <input name="email" type="email" required maxLength={180} />
          </label>
          <label>
            Registration no.
            <input name="registrationNumber" maxLength={40} placeholder="Optional" />
          </label>
          <label>
            Role
            <select name="role" defaultValue="inspector">
              <option value="inspector">Inspector</option>
              <option value="admin">Admin (sees all jobs in the app)</option>
            </select>
          </label>
        </div>
        <button className="admin-button primary" type="submit" disabled={busy}>
          Create login
        </button>
      </form>

      {message && <p className="admin-message">{message}</p>}
      {secret && (
        <p className="admin-secret">
          Temporary password (shown once): <code>{secret}</code>
        </p>
      )}
    </div>
  )
}
