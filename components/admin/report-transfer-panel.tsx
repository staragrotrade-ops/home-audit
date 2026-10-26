'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// QR code and link for the agent, so other buyers can buy the report.
export function ReportTransferPanel({
  jobId,
  address,
  transferJob,
}: {
  jobId: string
  address: string
  /** For a paid transfer order whose report has not been issued yet. */
  transferJob?: { needsRetry: boolean }
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [link, setLink] = useState<{ url: string; qr: string } | null>(null)

  async function call(path: string) {
    setBusy(true)
    setMessage('')
    const response = await fetch(`/api/admin/jobs/${jobId}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }).catch(() => null)
    const result = ((await response?.json().catch(() => ({}))) || {}) as {
      error?: string
      url?: string
      qr?: string
      outcome?: string
    }
    setBusy(false)
    if (!response?.ok) {
      setMessage(result.error || 'It did not work.')
      return null
    }
    return result
  }

  if (transferJob) {
    if (!transferJob.needsRetry) return null
    return (
      <span className="admin-actions">
        <button
          className="admin-button small"
          type="button"
          disabled={busy}
          onClick={async () => {
            const result = await call('transfer-complete')
            if (result) {
              setMessage('Report issued and emailed.')
              router.refresh()
            }
          }}
        >
          Issue transfer report now
        </button>
        {message && <span className="admin-inline-message">{message}</span>}
      </span>
    )
  }

  const emailText = link
    ? `Hi,

If another buyer is interested in ${address}, they can buy our inspection report in their own name for $250 + GST. They scan the QR code (attached) or open:
${link.url}

The report is issued in their name and emailed to them as soon as they have paid. Available for 30 days after the inspection.

Home Audit`
    : ''

  return (
    <div className="admin-transfer">
      <button
        className="admin-button small"
        type="button"
        disabled={busy}
        onClick={async () => {
          const result = await call('transfer-link')
          if (result?.url && result.qr) setLink({ url: result.url, qr: result.qr })
        }}
      >
        Transfer QR code for the agent
      </button>
      {message && <span className="admin-inline-message">{message}</span>}
      {link && (
        <div className="admin-transfer-body">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={link.qr} alt="QR code for buying this report" width={160} height={160} />
          <p>
            <a href={link.url} target="_blank" rel="noreferrer">
              {link.url}
            </a>{' '}
            ·{' '}
            <a href={link.qr} download={`report-transfer-${link.url.split('/').pop()}.png`}>
              Download QR (PNG)
            </a>
          </p>
          <label>
            Email text for the agent
            <textarea readOnly rows={9} value={emailText} onFocus={(event) => event.currentTarget.select()} />
          </label>
        </div>
      )}
    </div>
  )
}
