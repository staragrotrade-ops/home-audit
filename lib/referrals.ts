// Referral partners, attribution and commission. No imports, so the tests can
// load this file directly. Owner decisions (2026-10-14):
// - any kind of referrer can register or be added; each gets a short code and
//   a link https://homeaudit.com.au/?ref=CODE;
// - the last referral link clicked within 90 days decides the referrer;
//   the owner can set or clear the referrer on a job;
// - commission per referrer: a fixed amount per paid job, or a percentage of
//   the inspection fee excluding GST;
// - a job counts in the Melbourne month it was paid; test jobs never count.

export const REFERRAL_COOKIE = 'ha_ref'
export const REFERRAL_DAYS = 90

export const REFERRER_TYPES = [
  ['conveyancer_solicitor', 'Conveyancer or solicitor'],
  ['buyers_agent', "Buyer's agent"],
  ['mortgage_broker', 'Mortgage broker'],
  ['selling_agent', 'Real estate agent'],
  ['past_customer', 'Past customer'],
  ['other', 'Other'],
] as const

export type ReferrerType = (typeof REFERRER_TYPES)[number][0]
export type CommissionType = 'fixed' | 'percent'

export function referrerTypeLabel(type: string | null | undefined) {
  return REFERRER_TYPES.find(([value]) => value === type)?.[1] || 'Other'
}

export type ReferrerRecord = {
  id: string
  referrer_type?: string | null
  name: string
  agency?: string | null
  branch?: string | null
  mobile?: string | null
  email?: string | null
  ref_code: string
  status?: string | null
  source?: string | null
  notes?: string | null
  commission_type?: CommissionType | null
  commission_cents?: number | null
  commission_percent?: number | string | null
  approved_at?: string | null
  created_at?: string | null
}

// Codes are lower-case letters and digits, 3 to 12 characters, e.g. "js4kq".
export function normaliseRefCode(value: string | null | undefined) {
  const code = String(value || '').trim().toLowerCase()
  return /^[a-z0-9]{3,12}$/.test(code) ? code : null
}

const CODE_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'

// Initials of the first and last name, e.g. "Jane Smith" -> "js".
export function referrerCodeBase(name: string) {
  const ascii = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  const words = ascii.match(/[a-z]+/gi) || []
  const first = words[0]
  const last = words[words.length - 1]
  if (words.length >= 2 && first && last) return `${first[0]}${last[0]}`.toLowerCase()
  if (first) return first[0].toLowerCase()
  return 'r'
}

// Turns random bytes into a short suffix, e.g. [12, 200, 7] -> "q4k".
export function codeSuffix(bytes: ArrayLike<number>) {
  let value = ''
  for (let i = 0; i < bytes.length; i += 1) value += CODE_ALPHABET.charAt(bytes[i] % CODE_ALPHABET.length)
  return value
}

export function referralLink(siteUrl: string, code: string) {
  return `${siteUrl.replace(/\/$/, '')}/?ref=${encodeURIComponent(code)}`
}

// Free QR image of the referral link (no account; the code is not private).
export function referralQrUrl(link: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=16&data=${encodeURIComponent(link)}`
}

export function referrerOffice(referrer: Pick<ReferrerRecord, 'agency' | 'branch'>) {
  return [referrer.agency, referrer.branch].map((value) => String(value || '').trim()).filter(Boolean).join(' ')
}

/** "Jane Smith (ABC Conveyancing Frankston)" */
export function referrerDisplayName(referrer: Pick<ReferrerRecord, 'name' | 'agency' | 'branch'>) {
  const office = referrerOffice(referrer)
  return office ? `${referrer.name} (${office})` : referrer.name
}

export function referralCodeLabel(code: string, byCode: Map<string, ReferrerRecord>) {
  const referrer = byCode.get(code)
  return referrer ? referrerDisplayName(referrer) : `Unregistered code ${code}`
}

// ---- Commission ---------------------------------------------------------------

export function commissionLabel(
  referrer: Pick<ReferrerRecord, 'commission_type' | 'commission_cents' | 'commission_percent'>,
) {
  if (referrer.commission_type === 'fixed' && referrer.commission_cents != null) {
    return `$${(Number(referrer.commission_cents) / 100).toFixed(2)} per paid job`
  }
  if (referrer.commission_type === 'percent' && referrer.commission_percent != null) {
    return `${Number(referrer.commission_percent)}% of fee (excl. GST)`
  }
  return 'No commission'
}

/** Commission for one paid job from the fee excluding GST; null when none is set. */
export function commissionForJob(
  referrer: Pick<ReferrerRecord, 'commission_type' | 'commission_cents' | 'commission_percent'> | null,
  feeExGstCents: number,
) {
  if (!referrer) return null
  if (referrer.commission_type === 'fixed' && referrer.commission_cents != null) {
    return Math.max(0, Math.round(Number(referrer.commission_cents)))
  }
  if (referrer.commission_type === 'percent' && referrer.commission_percent != null) {
    return Math.max(0, Math.round((feeExGstCents * Number(referrer.commission_percent)) / 100))
  }
  return null
}

/** Columns from the dashboard form: none, fixed dollars per paid job, or a percentage. */
export function commissionColumns(type: string, rawValue: string | number | null | undefined) {
  const raw = String(rawValue ?? '').trim().replace(/[$,%\s]/g, '')
  if (!type) return { commission_type: null, commission_cents: null, commission_percent: null }
  const value = Number(raw)
  if (!raw || !Number.isFinite(value) || value < 0) throw new Error('Enter the commission as a number.')
  if (type === 'fixed') {
    if (value > 10000) throw new Error('The fixed commission looks too large.')
    return { commission_type: 'fixed' as const, commission_cents: Math.round(value * 100), commission_percent: null }
  }
  if (type === 'percent') {
    if (value > 100) throw new Error('The percentage must be 100 or less.')
    return { commission_type: 'percent' as const, commission_cents: null, commission_percent: Math.round(value * 100) / 100 }
  }
  throw new Error('Choose fixed or percentage.')
}

export function exGstCents(totalCents: number) {
  return Math.round(totalCents / 1.1)
}

// ---- Which referrer a job belongs to ---------------------------------------------

export type JobReferralFields = {
  ref_code?: string | null
  referrer_override_id?: string | null
  referrer_override_none?: boolean | null
}

export type EffectiveReferral = {
  referrer: ReferrerRecord | null
  code: string | null
  source: 'link' | 'manual' | 'none'
}

export function effectiveReferral(
  job: JobReferralFields,
  byId: Map<string, ReferrerRecord>,
  byCode: Map<string, ReferrerRecord>,
): EffectiveReferral {
  if (job.referrer_override_none) return { referrer: null, code: null, source: 'none' }
  if (job.referrer_override_id) {
    const referrer = byId.get(job.referrer_override_id) || null
    return { referrer, code: referrer?.ref_code || null, source: 'manual' }
  }
  const code = normaliseRefCode(job.ref_code)
  if (!code) return { referrer: null, code: null, source: 'none' }
  return { referrer: byCode.get(code) || null, code, source: 'link' }
}

// ---- Months (Melbourne) -----------------------------------------------------------

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/

export function isMonthKey(value: unknown): value is string {
  return typeof value === 'string' && MONTH_PATTERN.test(value)
}

function melbourneOffsetMinutes(at: Date) {
  const name =
    new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', timeZoneName: 'longOffset' })
      .formatToParts(at)
      .find((part) => part.type === 'timeZoneName')?.value || 'GMT+10:00'
  const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name)
  if (!match) return 600
  const minutes = Number(match[2]) * 60 + Number(match[3] || 0)
  return match[1] === '-' ? -minutes : minutes
}

function melbourneMidnightUtc(year: number, month: number) {
  const guess = new Date(Date.UTC(year, month - 1, 1))
  const offset = melbourneOffsetMinutes(new Date(guess.getTime() - 12 * 3_600_000))
  return new Date(guess.getTime() - offset * 60_000)
}

/** Start (inclusive) and end (exclusive) of a Melbourne calendar month, in UTC. */
export function melbourneMonthRange(month: string) {
  const match = MONTH_PATTERN.exec(month)
  if (!match) throw new Error('Month must look like 2026-10.')
  const year = Number(match[1])
  const number = Number(match[2])
  const start = melbourneMidnightUtc(year, number)
  const end = number === 12 ? melbourneMidnightUtc(year + 1, 1) : melbourneMidnightUtc(year, number + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function melbourneMonthKey(at: Date | string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date(at))
  return `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}`
}

/** This month and the 11 before it, newest first. */
export function recentMonthKeys(now = new Date(), count = 12) {
  const [year, month] = melbourneMonthKey(now).split('-').map(Number)
  const keys: string[] = []
  for (let i = 0; i < count; i += 1) {
    const date = new Date(Date.UTC(year, month - 1 - i, 1))
    keys.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return keys
}

export function monthLabel(month: string) {
  const [year, number] = month.split('-').map(Number)
  return new Date(Date.UTC(year, number - 1, 15)).toLocaleString('en-AU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

// ---- Monthly statement ------------------------------------------------------------

export type StatementPaidJob = JobReferralFields & {
  jobId: string
  reference: string
  address: string
  paidAt: string
  feeInclGstCents: number
  isTest: boolean
}

export type StatementJobLine = {
  jobId: string
  reference: string
  address: string
  paidAt: string
  feeInclGstCents: number
  feeExGstCents: number
  commissionCents: number | null
  source: 'link' | 'manual'
}

export type StatementRow = {
  key: string
  referrer: ReferrerRecord | null
  label: string
  code: string | null
  visits: number
  quotes: number
  paidJobs: number
  successRate: number | null
  feeExGstCents: number
  commissionCents: number | null
  jobs: StatementJobLine[]
}

/**
 * One row per referrer with activity in the month. visits = sessions that
 * arrived with the code; quotes = requests created in the month with that
 * referrer (link or set by the owner); success rate = paid jobs / quotes.
 */
export function buildReferralStatement(input: {
  referrers: ReferrerRecord[]
  paidJobs: StatementPaidJob[]
  quotes: Array<JobReferralFields & { isTest?: boolean }>
  visitsByCode: Map<string, number>
}): StatementRow[] {
  const byId = new Map(input.referrers.map((r) => [r.id, r]))
  const byCode = new Map(input.referrers.map((r) => [r.ref_code, r]))
  const rows = new Map<string, StatementRow>()
  const rowFor = (referral: EffectiveReferral) => {
    const key = referral.referrer ? `id:${referral.referrer.id}` : `code:${referral.code}`
    let row = rows.get(key)
    if (!row) {
      row = {
        key,
        referrer: referral.referrer,
        label: referral.referrer ? referrerDisplayName(referral.referrer) : `Unregistered code ${referral.code}`,
        code: referral.referrer?.ref_code || referral.code,
        visits: 0,
        quotes: 0,
        paidJobs: 0,
        successRate: null,
        feeExGstCents: 0,
        commissionCents: null,
        jobs: [],
      }
      rows.set(key, row)
    }
    return row
  }

  for (const [code, visits] of input.visitsByCode) {
    if (visits > 0) rowFor({ referrer: byCode.get(code) || null, code, source: 'link' }).visits += visits
  }
  for (const quote of input.quotes) {
    if (quote.isTest) continue
    const referral = effectiveReferral(quote, byId, byCode)
    if (referral.source !== 'none' && (referral.referrer || referral.code)) rowFor(referral).quotes += 1
  }
  for (const job of input.paidJobs) {
    if (job.isTest) continue
    const referral = effectiveReferral(job, byId, byCode)
    if (referral.source === 'none' || (!referral.referrer && !referral.code)) continue
    const row = rowFor(referral)
    const feeExGst = exGstCents(job.feeInclGstCents)
    const commission = commissionForJob(referral.referrer, feeExGst)
    row.paidJobs += 1
    row.feeExGstCents += feeExGst
    if (commission != null) row.commissionCents = (row.commissionCents || 0) + commission
    row.jobs.push({
      jobId: job.jobId,
      reference: job.reference,
      address: job.address,
      paidAt: job.paidAt,
      feeInclGstCents: job.feeInclGstCents,
      feeExGstCents: feeExGst,
      commissionCents: commission,
      source: referral.source,
    })
  }
  for (const row of rows.values()) {
    row.successRate = row.quotes > 0 ? row.paidJobs / row.quotes : null
    row.jobs.sort((a, b) => a.paidAt.localeCompare(b.paidAt))
  }
  return [...rows.values()].sort(
    (a, b) => b.paidJobs - a.paidJobs || b.quotes - a.quotes || b.visits - a.visits || a.label.localeCompare(b.label),
  )
}

function csvCell(value: string | number | null) {
  const text = value == null ? '' : String(value)
  // Stops a spreadsheet from treating a cell as a formula.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

const dollars = (cents: number | null) => (cents == null ? '' : (cents / 100).toFixed(2))

/** One line per paid job, then a total line per referrer. */
export function referralStatementCsv(month: string, rows: StatementRow[]) {
  const lines = [
    [
      'Month', 'Referrer', 'Business', 'Code', 'Link visits', 'Quotes', 'Paid jobs', 'Success rate',
      'Job', 'Address', 'Paid (Melbourne)', 'Fee incl. GST', 'Fee excl. GST', 'Commission', 'How',
    ].join(','),
  ]
  for (const row of rows) {
    const name = row.referrer?.name || row.label
    const office = row.referrer ? referrerOffice(row.referrer) : ''
    const rate = row.successRate == null ? '' : `${Math.round(row.successRate * 100)}%`
    for (const job of row.jobs) {
      lines.push(
        [
          month, name, office, row.code, '', '', '', '', job.reference, job.address,
          new Date(job.paidAt).toLocaleDateString('en-AU', { timeZone: 'Australia/Melbourne' }),
          dollars(job.feeInclGstCents), dollars(job.feeExGstCents), dollars(job.commissionCents),
          job.source === 'manual' ? 'Set by owner' : 'Referral link',
        ]
          .map(csvCell)
          .join(','),
      )
    }
    lines.push(
      [
        month, name, office, row.code, row.visits, row.quotes, row.paidJobs, rate, 'TOTAL', '', '', '',
        dollars(row.feeExGstCents), dollars(row.commissionCents), '',
      ]
        .map(csvCell)
        .join(','),
    )
  }
  return `${lines.join('\n')}\n`
}
