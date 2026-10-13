import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ExclusionToggle } from '@/components/admin/exclusion-toggle'
import { JobEditor } from '@/components/admin/job-editor'
import { JobWorkflow } from '@/components/admin/job-workflow'
import type { BookingRequestSummary } from '@/components/admin/booking-panel'
import { StaffManager } from '@/components/admin/staff-manager'
import { XeroSyncButton } from '@/components/admin/xero-sync-button'
import {
  CHANNEL_LABELS,
  INSPECTION_TYPE_LABELS,
  STAGE_LABELS,
  cleanSearch,
  formatDate,
  formatDateTime,
  formatDuration,
  melbourneDay,
  percent,
} from '@/lib/admin-format'
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from '@/lib/admin-session'
import {
  ACCESS_CHOICE_LABELS,
  BUYER_SITUATION_LABELS,
  PRICE_GUIDE_LABELS,
  type AccessChoice,
  type BuyerSituation,
} from '@/lib/booking-options'
import { CLOSED_STATUSES, JOB_STATUS_LABELS, type JobStatus } from '@/lib/job-status'
import { formatAud } from '@/lib/pricing'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { xeroConnectionName, xeroSetupMissing } from '@/lib/xero'

export const dynamic = 'force-dynamic'

const PERIODS = [
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: '365d', label: '12 months', days: 365 },
] as const

const JOB_VIEWS = [
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Completed / cancelled' },
  { key: 'archived', label: 'Archived' },
  { key: 'all', label: 'All' },
] as const

type Summary = {
  visitors: number
  pageViews: number
  activeSeconds: number
  quoteStarted: number
  quoteRequested: number
  contactClicked: number
  daily: { day: string; visitors: number }[]
  topPages: { path: string; views: number; visitors: number; avgSeconds: number }[]
  sources: { source: string; visitors: number; quotes: number }[]
  devices: { device: string; visitors: number }[]
  countries: { country: string; visitors: number }[]
}

type SessionRow = {
  session_id: string
  first_seen_at: string
  last_seen_at: string
  landing_path: string
  source: string
  device: string
  country: string
  page_views: number
  active_seconds: number
  quote_started: boolean
  quote_requested: boolean
  contact_clicked: boolean
}

type ActivityRow = {
  session_id: string
  path: string
  started_at: string
  active_seconds: number
}

type JobRow = {
  id: string
  public_reference: string
  service_family: 'existing_home' | 'new_home'
  inspection_type: string | null
  new_home_stages: string[]
  status: JobStatus
  payment_status: string
  intake_channel: string
  is_test: boolean
  archived_at: string | null
  inspection_status: string
  report_status: string
  confirmed_start: string | null
  preferred_date_1: string | null
  preferred_date_2: string | null
  deadline: string | null
  flexible_booking: boolean
  builder_name: string | null
  expected_ready_date: string | null
  access_contact: string | null
  access_notes: string | null
  source_self_reported: string | null
  internal_notes: string | null
  analytics_session_id: string | null
  created_at: string
  customer_snapshot: Record<string, string | null>
  property_snapshot: Record<string, string | null>
  quote_status: string
  quote_total: number | null
  price_guide_band: string
  listing_url: string | null
  travel_minutes: number | null
  pricing_decision: string | null
  pricing_reasons: string[] | null
  paid_at: string | null
  buyer_situation: string | null
  access_choice: string | null
  access_other_name: string | null
  access_other_phone: string | null
  details_submitted_at: string | null
  agent_name: string | null
  agent_agency: string | null
  agent_phone: string | null
  agent_email: string | null
  listing_price_guide: string | null
  listing_checked_at: string | null
  agent_texted_at: string | null
  booking_notified_at: string | null
  review_requested_at: string | null
  job_assignments: { staff_id: string }[] | null
  job_attribution:
    | { first_referrer: string | null; utm_source: string | null; normalized_source: string | null }
    | { first_referrer: string | null; utm_source: string | null; normalized_source: string | null }[]
    | null
  inspection_reports:
    | { id: string; report_kind: string; version_label: string; status: string; issued_at: string }[]
    | null
}

type StaffRow = {
  id: string
  email: string
  display_name: string
  role: string
  active: boolean
  registration_number: string | null
}

function emptySummary(): Summary {
  return {
    visitors: 0,
    pageViews: 0,
    activeSeconds: 0,
    quoteStarted: 0,
    quoteRequested: 0,
    contactClicked: 0,
    daily: [],
    topPages: [],
    sources: [],
    devices: [],
    countries: [],
  }
}

// Daily bars for short periods, monthly bars for a year.
function chartBars(summary: Summary, days: number) {
  const byDay = new Map(summary.daily.map((row) => [row.day, Number(row.visitors)]))
  if (days <= 90) {
    const bars: { label: string; value: number }[] = []
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const day = melbourneDay(new Date(Date.now() - offset * 86_400_000))
      bars.push({ label: day, value: byDay.get(day) || 0 })
    }
    return bars
  }
  const byMonth = new Map<string, number>()
  for (const [day, value] of byDay) byMonth.set(day.slice(0, 7), (byMonth.get(day.slice(0, 7)) || 0) + value)
  const bars: { label: string; value: number }[] = []
  const now = new Date()
  for (let offset = 11; offset >= 0; offset -= 1) {
    const month = melbourneDay(new Date(now.getFullYear(), now.getMonth() - offset, 15)).slice(0, 7)
    bars.push({ label: month, value: byMonth.get(month) || 0 })
  }
  return bars
}

function attributionOf(job: JobRow) {
  const value = Array.isArray(job.job_attribution) ? job.job_attribution[0] : job.job_attribution
  if (!value) return ''
  if (value.normalized_source) return value.normalized_source
  if (value.utm_source) return value.utm_source
  if (value.first_referrer) {
    try {
      return new URL(value.first_referrer).host
    } catch {
      return value.first_referrer
    }
  }
  return ''
}

function serviceLabel(job: JobRow) {
  if (job.service_family === 'existing_home') {
    return INSPECTION_TYPE_LABELS[job.inspection_type || ''] || 'Existing home'
  }
  const stages = (job.new_home_stages || []).map((stage) => STAGE_LABELS[stage] || stage)
  return `New home · ${stages.join(', ') || 'stage not chosen'}`
}

function Journey({ rows }: { rows: ActivityRow[] }) {
  if (rows.length === 0) return <p className="admin-muted">No page activity recorded.</p>
  return (
    <ol className="admin-journey">
      {rows.map((row, index) => (
        <li key={`${row.path}-${row.started_at}-${index}`}>
          <span>{formatDateTime(row.started_at)}</span>
          <code>{row.path}</code>
          <span>{formatDuration(row.active_seconds)}</span>
        </li>
      ))}
    </ol>
  )
}

function SetupNeeded() {
  return (
    <section className="admin-card">
      <h2>Database not connected</h2>
      <p>
        Add <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> and{' '}
        <code>SUPABASE_SECRET_KEY</code> to the Vercel project, apply the migrations in{' '}
        <code>supabase/migrations</code>, then redeploy.
      </p>
    </section>
  )
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; jobs?: string; q?: string; xero?: string }>
}) {
  if (!isAdminConfigured()) notFound()
  const store = await cookies()
  if (!verifyAdminSessionToken(store.get(ADMIN_COOKIE)?.value)) redirect('/admin/login')

  const params = await searchParams
  const period = PERIODS.find((item) => item.key === params.period) || PERIODS[1]
  const jobView = JOB_VIEWS.find((item) => item.key === params.jobs) || JOB_VIEWS[0]
  const search = cleanSearch(params.q)
  const since = new Date(Date.now() - period.days * 86_400_000).toISOString()

  const supabase = getSupabaseAdmin()

  const header = (
    <header className="admin-topbar">
      <div>
        <p className="admin-kicker">Home Audit</p>
        <h1>Admin</h1>
      </div>
      <nav className="admin-nav" aria-label="Admin sections">
        <a href="#visitors">Visitors</a>
        <a href="#jobs">Quotes &amp; jobs</a>
        <a href="#inspectors">Inspectors</a>
        <a href="#settings">Connections</a>
      </nav>
      <div className="admin-actions">
        <ExclusionToggle />
        <form action="/api/admin/logout" method="post">
          <button className="admin-button small" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </header>
  )

  if (!supabase) {
    return (
      <main id="main-content" className="admin-shell">
        {header}
        <SetupNeeded />
      </main>
    )
  }

  let jobsQuery = supabase
    .from('jobs')
    .select(
      'id,public_reference,service_family,inspection_type,new_home_stages,status,payment_status,intake_channel,is_test,archived_at,inspection_status,report_status,confirmed_start,preferred_date_1,preferred_date_2,deadline,flexible_booking,builder_name,expected_ready_date,access_contact,access_notes,source_self_reported,internal_notes,analytics_session_id,created_at,customer_snapshot,property_snapshot,quote_status,quote_total,price_guide_band,listing_url,travel_minutes,pricing_decision,pricing_reasons,paid_at,buyer_situation,access_choice,access_other_name,access_other_phone,details_submitted_at,agent_name,agent_agency,agent_phone,agent_email,listing_price_guide,listing_checked_at,agent_texted_at,booking_notified_at,review_requested_at,job_assignments(staff_id),job_attribution(first_referrer,utm_source,normalized_source),inspection_reports(id,report_kind,version_label,status,issued_at)',
    )
    .order('created_at', { ascending: false })
    .limit(60)

  if (jobView.key === 'open') {
    jobsQuery = jobsQuery.is('archived_at', null).not('status', 'in', `(${CLOSED_STATUSES.join(',')})`)
  } else if (jobView.key === 'closed') {
    jobsQuery = jobsQuery.is('archived_at', null).in('status', CLOSED_STATUSES)
  } else if (jobView.key === 'archived') {
    jobsQuery = jobsQuery.not('archived_at', 'is', null)
  }
  if (search) {
    const term = `"*${search}*"`
    jobsQuery = jobsQuery.or(
      [
        `public_reference.ilike.${term}`,
        `property_snapshot->>address.ilike.${term}`,
        `property_snapshot->>suburb.ilike.${term}`,
        `customer_snapshot->>email.ilike.${term}`,
        `customer_snapshot->>first_name.ilike.${term}`,
        `customer_snapshot->>last_name.ilike.${term}`,
        `customer_snapshot->>mobile.ilike.${term}`,
      ].join(','),
    )
  }

  const [summaryResult, sessionsResult, jobsResult, staffResult] = await Promise.all([
    supabase.rpc('get_analytics_summary', { p_since: since }),
    supabase
      .from('analytics_sessions')
      .select(
        'session_id,first_seen_at,last_seen_at,landing_path,source,device,country,page_views,active_seconds,quote_started,quote_requested,contact_clicked',
      )
      .gte('first_seen_at', since)
      .order('last_seen_at', { ascending: false })
      .limit(40),
    jobsQuery,
    supabase
      .from('staff')
      .select('id,email,display_name,role,active,registration_number')
      .order('created_at'),
  ])

  const loadErrors = [summaryResult.error, sessionsResult.error, jobsResult.error, staffResult.error]
    .filter(Boolean)
    .map((error) => error!.message)

  const summary: Summary = { ...emptySummary(), ...((summaryResult.data as Summary | null) || {}) }
  const sessions = (sessionsResult.data || []) as SessionRow[]
  const jobs = (jobsResult.data || []) as unknown as JobRow[]

  // Xero status per paid job, and the connection. Read separately so the
  // page still works before the Xero migration is applied.
  const paidIds = jobs.filter((job) => job.payment_status === 'paid').map((job) => job.id)
  const { data: xeroRows } = paidIds.length
    ? await supabase
        .from('xero_records')
        .select('job_id,invoice_number,synced_at,emailed_at,last_error')
        .in('job_id', paidIds)
    : { data: [] }
  const xeroByJob = new Map(
    ((xeroRows || []) as {
      job_id: string
      invoice_number: string | null
      synced_at: string | null
      emailed_at: string | null
      last_error: string | null
    }[]).map((row) => [row.job_id, row]),
  )
  // Booking requests per paid job. Read separately so the page still works
  // before the booking requests migration is applied.
  const { data: requestRows, error: requestError } = paidIds.length
    ? await supabase
        .from('booking_requests')
        .select(
          'id,job_id,channel,recipient_name,recipient_email,recipient_phone,status,slots,chosen_start,reply_message,created_at,expires_at',
        )
        .in('job_id', paidIds)
        .order('created_at', { ascending: false })
    : { data: [], error: null }
  const bookingTableMissing = Boolean(requestError && /booking_requests/.test(requestError.message))
  const requestsByJob = new Map<string, BookingRequestSummary[]>()
  for (const row of (requestRows || []) as (BookingRequestSummary & { job_id: string })[]) {
    requestsByJob.set(row.job_id, [...(requestsByJob.get(row.job_id) || []), row])
  }
  const xeroMissing = xeroSetupMissing()
  const xeroOrg = xeroMissing.length ? null : await xeroConnectionName(supabase).catch(() => null)
  const xeroNotice = params.xero || ''
  const staff = (staffResult.data || []) as StaffRow[]

  const journeyIds = [
    ...new Set([
      ...sessions.map((session) => session.session_id),
      ...jobs.map((job) => job.analytics_session_id).filter((id): id is string => Boolean(id)),
    ]),
  ]
  const { data: activityData } = journeyIds.length
    ? await supabase
        .from('page_activity')
        .select('session_id,path,started_at,active_seconds')
        .in('session_id', journeyIds)
        .order('started_at')
        .limit(2000)
    : { data: [] }
  const journeys = new Map<string, ActivityRow[]>()
  for (const row of (activityData || []) as ActivityRow[]) {
    journeys.set(row.session_id, [...(journeys.get(row.session_id) || []), row])
  }

  const bars = chartBars(summary, period.days)
  const maxBar = Math.max(1, ...bars.map((bar) => bar.value))
  const staffName = new Map(staff.map((member) => [member.id, member.display_name]))
  const linkFor = (next: Record<string, string>) => {
    const query = new URLSearchParams({
      period: period.key,
      jobs: jobView.key,
      ...(search ? { q: search } : {}),
      ...next,
    })
    return `/admin?${query.toString()}`
  }

  return (
    <main id="main-content" className="admin-shell">
      {header}

      {loadErrors.length > 0 && (
        <section className="admin-card admin-warning">
          <strong>Some data could not be loaded.</strong> Check that the latest migration has been applied.
          <ul>
            {loadErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="admin-section" id="visitors" aria-labelledby="visitors-heading">
        <div className="admin-section-head">
          <h2 id="visitors-heading">Visitors</h2>
          <div className="admin-tabs" role="tablist" aria-label="Period">
            {PERIODS.map((item) => (
              <Link
                key={item.key}
                href={linkFor({ period: item.key })}
                aria-current={item.key === period.key ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-tiles">
          <div className="admin-tile">
            <span>Visits</span>
            <strong>{summary.visitors}</strong>
          </div>
          <div className="admin-tile">
            <span>Page views</span>
            <strong>{summary.pageViews}</strong>
          </div>
          <div className="admin-tile">
            <span>Avg. time per visit</span>
            <strong>{formatDuration(summary.visitors ? summary.activeSeconds / summary.visitors : 0)}</strong>
          </div>
          <div className="admin-tile">
            <span>Started a quote</span>
            <strong>{summary.quoteStarted}</strong>
          </div>
          <div className="admin-tile">
            <span>Sent a quote request</span>
            <strong>{summary.quoteRequested}</strong>
            <small>{percent(summary.quoteRequested, summary.visitors)} of visits</small>
          </div>
          <div className="admin-tile">
            <span>Tapped phone / email</span>
            <strong>{summary.contactClicked}</strong>
          </div>
        </div>

        <div className="admin-card">
          <h3>Visits per {period.days > 90 ? 'month' : 'day'}</h3>
          <div className="admin-bars" role="img" aria-label="Visits over the selected period">
            {bars.map((bar) => (
              <div key={bar.label} className="admin-bar" title={`${bar.label}: ${bar.value}`}>
                <span style={{ height: `${(bar.value / maxBar) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="admin-bars-axis">
            <span>{bars[0]?.label}</span>
            <span>{bars[bars.length - 1]?.label}</span>
          </div>
        </div>

        <div className="admin-grid-2">
          <div className="admin-card">
            <h3>Where visitors came from</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Visits</th>
                  <th>Quote requests</th>
                </tr>
              </thead>
              <tbody>
                {summary.sources.map((row) => (
                  <tr key={row.source}>
                    <td>{row.source}</td>
                    <td>{row.visitors}</td>
                    <td>{row.quotes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-card">
            <h3>Most viewed pages</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Views</th>
                  <th>Avg. time</th>
                </tr>
              </thead>
              <tbody>
                {summary.topPages.map((row) => (
                  <tr key={row.path}>
                    <td>
                      <code>{row.path}</code>
                    </td>
                    <td>{row.views}</td>
                    <td>{formatDuration(row.avgSeconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-card">
            <h3>Devices</h3>
            <table className="admin-table">
              <tbody>
                {summary.devices.map((row) => (
                  <tr key={row.device}>
                    <td>{row.device}</td>
                    <td>{percent(row.visitors, summary.visitors)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-card">
            <h3>Countries</h3>
            <table className="admin-table">
              <tbody>
                {summary.countries.map((row) => (
                  <tr key={row.country}>
                    <td>{row.country === '??' ? 'Unknown' : row.country}</td>
                    <td>{row.visitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <h3>Recent visits</h3>
          {sessions.length === 0 ? (
            <p className="admin-muted">No visits recorded in this period yet.</p>
          ) : (
            <div className="admin-visits">
              {sessions.map((session) => (
                <details key={session.session_id}>
                  <summary>
                    <span>{formatDateTime(session.first_seen_at)}</span>
                    <span>{session.source}</span>
                    <code>{session.landing_path || '/'}</code>
                    <span>
                      {session.page_views} page{session.page_views === 1 ? '' : 's'} ·{' '}
                      {formatDuration(session.active_seconds)}
                    </span>
                    <span className="admin-badges">
                      {session.device && <em>{session.device}</em>}
                      {session.country && <em>{session.country}</em>}
                      {session.quote_requested ? (
                        <em className="good">Quote request</em>
                      ) : session.quote_started ? (
                        <em>Started quote</em>
                      ) : null}
                      {session.contact_clicked && <em>Phone/email tap</em>}
                    </span>
                  </summary>
                  <Journey rows={journeys.get(session.session_id) || []} />
                </details>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="admin-section" id="jobs" aria-labelledby="jobs-heading">
        <div className="admin-section-head">
          <h2 id="jobs-heading">Quotes &amp; jobs</h2>
          <div className="admin-tabs" role="tablist" aria-label="Job list">
            {JOB_VIEWS.map((item) => (
              <Link
                key={item.key}
                href={linkFor({ jobs: item.key })}
                aria-current={item.key === jobView.key ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <form className="admin-search" action="/admin#jobs" method="get">
          <input type="hidden" name="period" value={period.key} />
          <input type="hidden" name="jobs" value={jobView.key} />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search name, email, phone, address or reference"
            aria-label="Search jobs"
          />
          <button className="admin-button" type="submit">
            Search
          </button>
        </form>

        {jobs.length === 0 ? (
          <p className="admin-muted">No jobs in this list.</p>
        ) : (
          <div className="admin-jobs">
            {jobs.map((job) => {
              const customer = job.customer_snapshot || {}
              const property = job.property_snapshot || {}
              const assigned = job.job_assignments?.[0]?.staff_id || ''
              const source = attributionOf(job)
              const reports = job.inspection_reports || []
              const journey = job.analytics_session_id ? journeys.get(job.analytics_session_id) || [] : []
              return (
                <details key={job.id} className="admin-job">
                  <summary>
                    <span className="admin-job-main">
                      <strong>{property.suburb || property.address || 'No address'}</strong>
                      <span>
                        {serviceLabel(job)} · {customer.first_name} {customer.last_name}
                      </span>
                    </span>
                    <span className="admin-badges">
                      <em className={`status-${job.status}`}>{JOB_STATUS_LABELS[job.status] || job.status}</em>
                      {job.payment_status === 'paid' && <em className="good">Paid</em>}
                      {job.quote_status === 'manual_review' && <em className="warn">Price review</em>}
                      {job.payment_status === 'paid' && !job.agent_name && <em className="warn">Find agent</em>}
                      {job.intake_channel === 'email_handoff' && <em>Via email app</em>}
                      {assigned && <em>{staffName.get(assigned) || 'Assigned'}</em>}
                      {job.is_test && <em className="warn">Test</em>}
                      {job.archived_at && <em>Archived</em>}
                    </span>
                    <span className="admin-job-meta">
                      {job.public_reference} · {formatDateTime(job.created_at)}
                    </span>
                  </summary>

                  <div className="admin-job-body">
                    <div className="admin-grid-2">
                      <dl className="admin-facts">
                        <dt>Customer</dt>
                        <dd>
                          {customer.first_name} {customer.last_name}
                          <br />
                          {customer.mobile && <a href={`tel:${customer.mobile}`}>{customer.mobile}</a>}
                          <br />
                          {customer.email && <a href={`mailto:${customer.email}`}>{customer.email}</a>}
                        </dd>
                        {(customer.conveyancer_email || customer.agent_email) && (
                          <>
                            <dt>Conveyancer / agent</dt>
                            <dd>
                              {customer.conveyancer_email}
                              {customer.conveyancer_email && customer.agent_email ? <br /> : null}
                              {customer.agent_email}
                            </dd>
                          </>
                        )}
                        <dt>Property</dt>
                        <dd>
                          {property.address}
                          <br />
                          {[property.property_type, property.storeys && `${property.storeys} storey`, property.bedrooms && `${property.bedrooms} bed`, property.bathrooms && `${property.bathrooms} bath`]
                            .filter(Boolean)
                            .join(' · ')}
                        </dd>
                        <dt>Price</dt>
                        <dd>
                          {job.quote_total ? formatAud(Math.round(Number(job.quote_total) * 100)) : 'Not priced'}
                          {job.pricing_decision === 'instant' ? ' · instant' : ''}
                          {job.pricing_decision === 'manual' && job.pricing_reasons?.length
                            ? ` · review: ${job.pricing_reasons.join('; ')}`
                            : ''}
                          <br />
                          {job.price_guide_band ? `Customer said: ${PRICE_GUIDE_LABELS[job.price_guide_band] || job.price_guide_band}` : ''}
                          {job.travel_minutes ? ` · ${job.travel_minutes} min drive` : ''}
                          {job.paid_at ? ` · paid ${formatDateTime(job.paid_at)}` : ''}
                        </dd>
                        {job.details_submitted_at && (
                          <>
                            <dt>Buyer</dt>
                            <dd>
                              {job.buyer_situation
                                ? BUYER_SITUATION_LABELS[job.buyer_situation as BuyerSituation]
                                : '—'}
                              <br />
                              Contact for access:{' '}
                              {job.access_choice ? ACCESS_CHOICE_LABELS[job.access_choice as AccessChoice] : '—'}
                              {job.access_choice === 'other' && (
                                <>
                                  {' '}
                                  · {job.access_other_name}{' '}
                                  {job.access_other_phone && (
                                    <a href={`tel:${job.access_other_phone}`}>{job.access_other_phone}</a>
                                  )}
                                </>
                              )}
                            </dd>
                          </>
                        )}
                        <dt>Service</dt>
                        <dd>
                          {serviceLabel(job)}
                          {job.builder_name ? ` · Builder: ${job.builder_name}` : ''}
                          {job.expected_ready_date ? ` · Ready about ${formatDate(job.expected_ready_date)}` : ''}
                        </dd>
                      </dl>
                      <dl className="admin-facts">
                        <dt>Preferred dates</dt>
                        <dd>
                          {[job.preferred_date_1, job.preferred_date_2].filter(Boolean).map(formatDate).join(', ') || '—'}
                          {job.flexible_booking ? ' · flexible' : ''}
                        </dd>
                        {job.deadline && (
                          <>
                            <dt>Auction / contract deadline</dt>
                            <dd>{formatDate(job.deadline)}</dd>
                          </>
                        )}
                        <dt>Booked</dt>
                        <dd>{job.confirmed_start ? formatDateTime(job.confirmed_start) : 'Not booked'}</dd>
                        <dt>Access</dt>
                        <dd>
                          {job.access_contact || '—'}
                          {job.access_notes ? <><br />{job.access_notes}</> : null}
                        </dd>
                        <dt>Came via</dt>
                        <dd>
                          {CHANNEL_LABELS[job.intake_channel] || job.intake_channel}
                          {source ? ` · ${source}` : ''}
                          {job.source_self_reported ? ` · said: ${job.source_self_reported}` : ''}
                        </dd>
                        <dt>Progress</dt>
                        <dd>
                          Inspection: {job.inspection_status.replace('_', ' ')} · Report:{' '}
                          {job.report_status.replace('_', ' ')} · Payment: {job.payment_status.replace('_', ' ')}
                        </dd>
                      </dl>
                    </div>

                    {reports.length > 0 && (
                      <div className="admin-reports">
                        <h4>Reports</h4>
                        <ul>
                          {reports.map((report) => (
                            <li key={report.id}>
                              <a href={`/api/admin/reports/${report.id}/download`} target="_blank" rel="noreferrer">
                                {report.report_kind.replaceAll('_', ' ')} {report.version_label}
                              </a>{' '}
                              · {formatDateTime(report.issued_at)}
                              {report.status !== 'issued' ? ` · ${report.status}` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {job.intake_channel === 'email_handoff' && (
                      <p className="admin-note">
                        The customer was sent to their email app with these details. Check the inbox: if no
                        email arrived, they may not have pressed send.
                      </p>
                    )}

                    {journey.length > 0 && (
                      <details className="admin-subdetails">
                        <summary>Pages this customer viewed before asking</summary>
                        <Journey rows={journey} />
                      </details>
                    )}

                    {job.payment_status === 'paid' && !job.is_test && (
                      <div className="admin-xero">
                        <strong>Xero:</strong>{' '}
                        {(() => {
                          const row = xeroByJob.get(job.id)
                          if (row?.synced_at) {
                            return (
                              <>
                                invoice {row.invoice_number || ''} paid
                                {row.emailed_at ? ' · emailed to customer' : ''}
                                {!row.emailed_at && row.last_error ? ` · email problem: ${row.last_error}` : ''}
                              </>
                            )
                          }
                          return (
                            <>
                              {row?.last_error ? `not sent – ${row.last_error} ` : 'not sent yet '}
                              {xeroOrg && <XeroSyncButton jobId={job.id} label="Send to Xero" />}
                            </>
                          )
                        })()}
                      </div>
                    )}

                    <JobWorkflow
                      jobId={job.id}
                      paid={job.payment_status === 'paid'}
                      quoteStatus={job.quote_status}
                      address={[property.address, property.suburb].filter(Boolean).join(', ')}
                      service={`${serviceLabel(job)} inspection`.replace(/ inspection inspection$/, ' inspection')}
                      dateHint={[job.preferred_date_1, job.preferred_date_2]
                        .filter((value): value is string => Boolean(value))
                        .map(formatDate)
                        .join(' or ')}
                      customerFirstName={customer.first_name || ''}
                      customerMobile={customer.mobile || ''}
                      confirmedStart={job.confirmed_start}
                      bookingNotifiedAt={job.booking_notified_at}
                      reviewRequestedAt={job.review_requested_at}
                      agentTextedAt={job.agent_texted_at}
                      bookingRequests={requestsByJob.get(job.id) || []}
                      bookingTableMissing={bookingTableMissing}
                      accessOther={
                        job.access_choice === 'other' && job.access_other_name
                          ? { name: job.access_other_name, phone: job.access_other_phone || '' }
                          : null
                      }
                      reviewUrl={process.env.GOOGLE_REVIEW_URL || ''}
                      agent={{
                        name: job.agent_name || '',
                        agency: job.agent_agency || '',
                        phone: job.agent_phone || '',
                        email: job.agent_email || '',
                        listingUrl: job.listing_url || '',
                        priceGuide: job.listing_price_guide || '',
                        checked: Boolean(job.listing_checked_at),
                      }}
                    />

                    <JobEditor
                      jobId={job.id}
                      status={job.status}
                      staffId={assigned}
                      staff={staff}
                      archived={Boolean(job.archived_at)}
                      isTest={job.is_test}
                      internalNotes={job.internal_notes || ''}
                    />
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </section>

      <section className="admin-section" id="settings" aria-labelledby="settings-heading">
        <div className="admin-section-head">
          <h2 id="settings-heading">Connections</h2>
        </div>
        <div className="admin-card">
          <h3>Xero</h3>
          {xeroNotice && (
            <p className={`admin-message${xeroNotice.startsWith('connected:') ? '' : ' error'}`}>
              {xeroNotice.startsWith('connected:')
                ? `Connected to ${xeroNotice.slice('connected:'.length)}.`
                : xeroNotice}
            </p>
          )}
          {xeroMissing.length > 0 ? (
            <p className="admin-muted">
              Not set up yet. Missing in Vercel: {xeroMissing.join(', ')}.
            </p>
          ) : (
            <p>
              {xeroOrg ? `Connected to ${xeroOrg}. Paid jobs get a paid invoice, emailed by Xero.` : 'Not connected.'}{' '}
              <a className="admin-button small" href="/api/admin/xero/connect">
                {xeroOrg ? 'Reconnect Xero' : 'Connect Xero'}
              </a>
            </p>
          )}
        </div>
      </section>

      <section className="admin-section" id="inspectors" aria-labelledby="inspectors-heading">
        <div className="admin-section-head">
          <h2 id="inspectors-heading">Inspectors</h2>
        </div>
        <div className="admin-card">
          <p className="admin-muted">
            These logins are for the inspector app. An inspector only sees the jobs assigned to them.
          </p>
          <StaffManager staff={staff} />
        </div>
      </section>
    </main>
  )
}
