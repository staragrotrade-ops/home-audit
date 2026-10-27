'use client'

import { useState } from 'react'

// Download with a code emailed to the customer: a forwarded link alone does
// not open the report.
export function ReportDownload({ token, chinese = false }: { token: string; chinese?: boolean }) {
  const [stage, setStage] = useState<'start' | 'code' | 'ready'>('start')
  const [sentTo, setSentTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function post(path: string, body: unknown) {
    const response = await fetch(`/api/order/${token}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as { error?: string; sentTo?: string }
    return { ok: Boolean(response?.ok), result }
  }

  async function sendCode() {
    setBusy(true)
    setError('')
    const { ok, result } = await post('report-code', {})
    setBusy(false)
    if (!ok) return setError(result.error || 'The code could not be sent.')
    setSentTo(result.sentTo || 'your email')
    setStage('code')
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = String(new FormData(event.currentTarget).get('code') || '').replace(/\D/g, '')
    setBusy(true)
    setError('')
    const { ok, result } = await post('report-verify', { code })
    setBusy(false)
    if (!ok) return setError(result.error || 'That code did not work.')
    if (chinese) return setStage('ready')
    window.location.assign(`/api/order/${token}/report`)
  }

  return (
    <div className="report-download">
      {stage === 'ready' ? (
        <p className="button-row">
          <a className="button" href={`/api/order/${token}/report`}>
            Download the report (English)
          </a>{' '}
          <a className="button button-secondary" href={`/api/order/${token}/report?lang=zh`}>
            下载中文翻译 (PDF)
          </a>
        </p>
      ) : stage === 'start' ? (
        <>
          <p className="order-hint">
            To protect your report, we email a 6-digit code to the address on this order before it opens. In
            this browser the report then stays open for 12 hours.
          </p>
          <button className="button" type="button" disabled={busy} onClick={() => void sendCode()}>
            {busy ? 'Sending…' : 'Email me a code to download the report'}
          </button>
        </>
      ) : (
        <form onSubmit={verify}>
          <p className="order-hint">We emailed a code to {sentTo}. It works for 15 minutes.</p>
          <div className="field">
            <label htmlFor="report-code">Code</label>
            <input
              id="report-code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,7}"
              maxLength={7}
              required
            />
          </div>
          <button className="button" type="submit" disabled={busy}>
            {busy ? 'Checking…' : 'Download the report (PDF)'}
          </button>{' '}
          <button className="button button-secondary" type="button" disabled={busy} onClick={() => void sendCode()}>
            Send a new code
          </button>
        </form>
      )}
      {error && (
        <p className="quote-status" data-type="error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
