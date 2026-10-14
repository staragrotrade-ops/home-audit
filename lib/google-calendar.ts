// Server-only. Puts booked jobs in Google Calendar, like the 137B site.
// The owner connects once in the dashboard (Connections → Google Calendar);
// tokens are stored encrypted in integration_accounts.
import type { SupabaseClient } from '@supabase/supabase-js'
import { INSPECTION_TYPE_LABELS, STAGE_LABELS } from '@/lib/admin-format'
import { ACCESS_CHOICE_LABELS, BUYER_SITUATION_LABELS, type AccessChoice, type BuyerSituation } from '@/lib/booking-options'
import { buildCalendarEvent, calendarEventId } from '@/lib/calendar-event'
import { decryptCredentials, encryptCredentials } from '@/lib/secure-credentials'
import { SITE_URL } from '@/lib/site'

const GOOGLE_AUTH = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO = 'https://www.googleapis.com/oauth2/v3/userinfo'
const SCOPE = 'https://www.googleapis.com/auth/calendar.events openid email'

// The same "NBI job" calendar as the 137B site, unless GOOGLE_CALENDAR_ID is set.
const DEFAULT_CALENDAR_ID = '69l2e18k2r4dk0a68f292tdnv4@group.calendar.google.com'

type GoogleToken = {
  access_token: string
  refresh_token?: string
  expires_in?: number
  expires_at?: string
}

export function calendarId() {
  const configured = process.env.GOOGLE_CALENDAR_ID?.trim()
  return configured || DEFAULT_CALENDAR_ID
}

export function googleCalendarSetupMissing() {
  return ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI', 'INTEGRATION_ENCRYPTION_KEY'].filter(
    (name) => !process.env[name]?.trim(),
  )
}

export function getGoogleAuthorisationUrl(state: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirect = process.env.GOOGLE_REDIRECT_URI
  if (!clientId || !redirect) throw new Error('Google Calendar is not set up (GOOGLE_CLIENT_ID / GOOGLE_REDIRECT_URI).')
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    include_granted_scopes: 'true',
    prompt: 'consent',
    state,
  })
  return `${GOOGLE_AUTH}?${params.toString()}`
}

async function oauthError(prefix: string, response: Response) {
  const body = (await response.json().catch(() => ({}))) as { error?: string; error_description?: string }
  const detail = [body.error, body.error_description].filter(Boolean).join(': ').slice(0, 300)
  return `${prefix} (${response.status})${detail ? `: ${detail}` : ''}`
}

async function tokenRequest(body: URLSearchParams): Promise<GoogleToken> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Google Calendar is not set up (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).')
  body.set('client_id', clientId)
  body.set('client_secret', clientSecret)
  const response = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(await oauthError('Google sign-in failed', response))
  const token = (await response.json()) as GoogleToken
  if (!token.access_token) throw new Error('Google did not return an access token.')
  token.expires_at = new Date(Date.now() + ((token.expires_in || 3600) - 60) * 1000).toISOString()
  return token
}

export async function connectGoogleCalendar(supabase: SupabaseClient, code: string) {
  const redirect = process.env.GOOGLE_REDIRECT_URI
  if (!redirect) throw new Error('Google Calendar is not set up (GOOGLE_REDIRECT_URI).')
  const token = await tokenRequest(
    new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect }),
  )
  if (!token.refresh_token) throw new Error('Google did not return a refresh token. Try "Connect" again.')
  const profile = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: 'no-store',
  })
    .then((response) => (response.ok ? (response.json() as Promise<{ email?: string }>) : {}))
    .catch(() => ({}) as { email?: string })
  const email = (profile as { email?: string }).email || 'Google account'

  // One Google connection at a time.
  await supabase.from('integration_accounts').delete().eq('provider', 'google_calendar')
  const now = new Date().toISOString()
  const { error } = await supabase.from('integration_accounts').insert({
    provider: 'google_calendar',
    account_key: email,
    account_name: email,
    credentials: encryptCredentials(token),
    connected_at: now,
    updated_at: now,
  })
  if (error) throw new Error(error.message)
  return email
}

export async function googleCalendarConnection(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('integration_accounts')
    .select('account_name,connected_at')
    .eq('provider', 'google_calendar')
    .maybeSingle()
  return data ? (data.account_name as string | null) || 'Connected' : null
}

async function accessToken(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('integration_accounts')
    .select('id,credentials')
    .eq('provider', 'google_calendar')
    .maybeSingle()
  if (error || !data) throw new Error('Google Calendar is not connected. Press "Connect Google Calendar" in the dashboard.')
  const token = decryptCredentials<GoogleToken>(data.credentials)
  if (token.expires_at && new Date(token.expires_at).getTime() > Date.now()) return token.access_token
  if (!token.refresh_token) throw new Error('Google Calendar needs to be reconnected.')
  const fresh = await tokenRequest(
    new URLSearchParams({ grant_type: 'refresh_token', refresh_token: token.refresh_token }),
  ).catch((refreshError: Error) => {
    throw new Error(
      /invalid_grant/.test(refreshError.message)
        ? 'Google Calendar needs to be reconnected (access was removed or expired).'
        : refreshError.message,
    )
  })
  fresh.refresh_token = fresh.refresh_token || token.refresh_token
  await supabase
    .from('integration_accounts')
    .update({ credentials: encryptCredentials(fresh), updated_at: new Date().toISOString() })
    .eq('id', data.id)
  return fresh.access_token
}

function eventsUrl(eventId?: string) {
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}/events`
  return eventId ? `${base}/${encodeURIComponent(eventId)}` : base
}

type CalendarJob = {
  id: string
  public_reference: string
  status: string
  is_test: boolean
  service_family: string
  inspection_type: string | null
  new_home_stages: string[] | null
  payment_status: string
  quote_total: number | string | null
  confirmed_start: string | null
  confirmed_end: string | null
  customer_snapshot: Record<string, string | null> | null
  property_snapshot: Record<string, string | null> | null
  buyer_situation: string | null
  access_choice: string | null
  access_other_name: string | null
  access_other_phone: string | null
  access_notes: string | null
  agent_name: string | null
  agent_agency: string | null
  agent_phone: string | null
}

async function recordResult(supabase: SupabaseClient, jobId: string, error: string | null) {
  await supabase
    .from('jobs')
    .update(
      error
        ? { calendar_error: error.slice(0, 500) }
        : { calendar_synced_at: new Date().toISOString(), calendar_error: null },
    )
    .eq('id', jobId)
}

async function removeEvent(supabase: SupabaseClient, jobId: string) {
  const token = await accessToken(supabase)
  const response = await fetch(eventsUrl(calendarEventId(jobId)), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!response.ok && response.status !== 404 && response.status !== 410) {
    throw new Error(`Google Calendar event could not be removed (${response.status}).`)
  }
  await supabase.from('jobs').update({ calendar_synced_at: null, calendar_error: null }).eq('id', jobId)
}

/**
 * Creates, updates or removes the job's calendar event so it matches the job:
 * an event while the job is booked and not cancelled; none otherwise. Test
 * jobs are skipped. Never throws: the result says what happened.
 */
export async function syncJobCalendar(
  supabase: SupabaseClient,
  jobId: string,
): Promise<{ ok: boolean; action: 'created' | 'updated' | 'removed' | 'skipped'; error?: string }> {
  try {
    if (googleCalendarSetupMissing().length) return { ok: true, action: 'skipped' }
    const { data, error } = await supabase
      .from('jobs')
      .select(
        'id,public_reference,status,is_test,service_family,inspection_type,new_home_stages,payment_status,quote_total,confirmed_start,confirmed_end,customer_snapshot,property_snapshot,buyer_situation,access_choice,access_other_name,access_other_phone,access_notes,agent_name,agent_agency,agent_phone',
      )
      .eq('id', jobId)
      .maybeSingle()
    if (error || !data) throw new Error('Job not found.')
    const job = data as CalendarJob
    if (!(await googleCalendarConnection(supabase))) return { ok: true, action: 'skipped' }

    if (job.is_test) return { ok: true, action: 'skipped' }
    if (!job.confirmed_start || job.status === 'cancelled') {
      await removeEvent(supabase, jobId)
      return { ok: true, action: 'removed' }
    }

    const customer = job.customer_snapshot || {}
    const property = job.property_snapshot || {}
    const service =
      job.service_family === 'new_home'
        ? `New home (${(job.new_home_stages || []).map((stage) => STAGE_LABELS[stage] || stage).join(', ')})`
        : `${INSPECTION_TYPE_LABELS[job.inspection_type || ''] || 'Building'} inspection`
    const access =
      job.access_choice === 'other'
        ? [job.access_other_name, job.access_other_phone].filter(Boolean).join(' ')
        : job.access_choice
          ? ACCESS_CHOICE_LABELS[job.access_choice as AccessChoice] || job.access_choice
          : ''
    const event = buildCalendarEvent({
      reference: job.public_reference,
      service,
      address: property.address || '',
      suburb: property.suburb || '',
      postcode: property.postcode || '',
      start: job.confirmed_start,
      end: job.confirmed_end,
      paymentStatus: job.payment_status,
      totalCents: job.quote_total == null ? null : Math.round(Number(job.quote_total) * 100),
      clientName: [customer.first_name, customer.last_name].filter(Boolean).join(' '),
      phone: customer.mobile || '',
      email: customer.email || '',
      buyerSituation: job.buyer_situation
        ? BUYER_SITUATION_LABELS[job.buyer_situation as BuyerSituation] || job.buyer_situation
        : '',
      access,
      agent: [job.agent_name, job.agent_agency, job.agent_phone].filter(Boolean).join(' · '),
      notes: job.access_notes || '',
      adminUrl: `${SITE_URL}/admin?q=${encodeURIComponent(job.public_reference)}#jobs`,
    })

    const token = await accessToken(supabase)
    const id = calendarEventId(jobId)
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    // status: a deleted event with the same id comes back when updated.
    const body = { ...event, status: 'confirmed', extendedProperties: { private: { job_id: jobId, reference: job.public_reference } } }

    // Update the job's event if it exists; otherwise create it with the fixed id.
    let response = await fetch(eventsUrl(id), { method: 'PUT', headers, body: JSON.stringify(body), cache: 'no-store' })
    let action: 'created' | 'updated' = 'updated'
    if (response.status === 404) {
      response = await fetch(eventsUrl(), {
        method: 'POST',
        headers,
        body: JSON.stringify({ id, ...body }),
        cache: 'no-store',
      })
      action = 'created'
    }
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300)
      throw new Error(`Google Calendar said no (${response.status}). ${detail}`)
    }
    await recordResult(supabase, jobId, null)
    return { ok: true, action }
  } catch (syncError) {
    const message = syncError instanceof Error ? syncError.message : 'Google Calendar sync failed.'
    await recordResult(supabase, jobId, message).catch(() => undefined)
    console.error('calendar_sync_failed', { jobId, message })
    return { ok: false, action: 'skipped', error: message }
  }
}
