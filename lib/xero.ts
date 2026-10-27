// Server-only. Xero: a paid invoice for each job paid online, emailed to the
// customer by Xero. Works like the 137B site, with its own Xero connection.
import type { SupabaseClient } from '@supabase/supabase-js'
import { INSPECTION_TYPE_LABELS, STAGE_LABELS } from '@/lib/admin-format'
import { decryptCredentials, encryptCredentials } from '@/lib/secure-credentials'

const XERO_AUTH = 'https://login.xero.com/identity/connect/authorize'
const XERO_TOKEN = 'https://identity.xero.com/connect/token'
const XERO_CONNECTIONS = 'https://api.xero.com/connections'
const XERO_API = 'https://api.xero.com/api.xro/2.0'

type XeroToken = {
  access_token: string
  refresh_token?: string
  expires_in?: number
  expires_at?: string
}

export function xeroSetupMissing() {
  return [
    'XERO_CLIENT_ID',
    'XERO_CLIENT_SECRET',
    'XERO_REDIRECT_URI',
    'XERO_SALES_ACCOUNT_CODE',
    'XERO_PAYMENT_ACCOUNT_CODE',
    'INTEGRATION_ENCRYPTION_KEY',
  ].filter((name) => !process.env[name]?.trim())
}

export function getXeroAuthorisationUrl(state: string) {
  const clientId = process.env.XERO_CLIENT_ID
  const redirect = process.env.XERO_REDIRECT_URI
  if (!clientId || !redirect) throw new Error('Xero is not set up (XERO_CLIENT_ID / XERO_REDIRECT_URI).')
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirect,
    scope: 'openid profile email offline_access accounting.contacts accounting.invoices accounting.payments',
    state,
  })
  return `${XERO_AUTH}?${params.toString()}`
}

async function tokenRequest(body: URLSearchParams): Promise<XeroToken> {
  const clientId = process.env.XERO_CLIENT_ID
  const clientSecret = process.env.XERO_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Xero is not set up (XERO_CLIENT_ID / XERO_CLIENT_SECRET).')
  const response = await fetch(XERO_TOKEN, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Xero sign-in failed (${response.status}). Reconnect Xero in the dashboard.`)
  const token = (await response.json()) as XeroToken
  token.expires_at = new Date(Date.now() + ((token.expires_in || 1800) - 60) * 1000).toISOString()
  return token
}

export function exchangeXeroCode(code: string) {
  const redirect = process.env.XERO_REDIRECT_URI
  if (!redirect) throw new Error('Xero is not set up (XERO_REDIRECT_URI).')
  return tokenRequest(new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect }))
}

export async function getXeroConnections(accessToken: string) {
  const response = await fetch(XERO_CONNECTIONS, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Xero organisations could not be read (${response.status}).`)
  return (await response.json()) as { tenantId: string; tenantName?: string }[]
}

export async function saveXeroConnection(
  supabase: SupabaseClient,
  token: XeroToken,
  tenant: { tenantId: string; tenantName?: string },
) {
  // One Xero organisation at a time: replace any earlier connection.
  await supabase.from('integration_accounts').delete().eq('provider', 'xero').neq('account_key', tenant.tenantId)
  const now = new Date().toISOString()
  const { error } = await supabase.from('integration_accounts').upsert(
    {
      provider: 'xero',
      account_key: tenant.tenantId,
      account_name: tenant.tenantName || null,
      credentials: encryptCredentials(token),
      connected_at: now,
      updated_at: now,
    },
    { onConflict: 'provider,account_key' },
  )
  if (error) throw new Error(error.message)
}

export async function xeroConnectionName(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('integration_accounts')
    .select('account_name,connected_at')
    .eq('provider', 'xero')
    .maybeSingle()
  return data ? (data.account_name as string | null) || 'Connected' : null
}

// Xero refresh tokens change every time they are used. The update is only
// applied if nobody else refreshed first; otherwise the newer token is used.
async function connection(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('integration_accounts')
    .select('id,account_key,credentials,updated_at')
    .eq('provider', 'xero')
    .maybeSingle()
  if (error || !data) throw new Error('Xero is not connected. Press "Connect Xero" in the dashboard.')

  const token = decryptCredentials<XeroToken>(data.credentials)
  if (token.expires_at && new Date(token.expires_at).getTime() > Date.now()) {
    return { token, tenantId: data.account_key as string }
  }
  if (!token.refresh_token) throw new Error('Xero needs to be reconnected.')
  const fresh = await tokenRequest(
    new URLSearchParams({ grant_type: 'refresh_token', refresh_token: token.refresh_token }),
  )
  const { data: saved } = await supabase
    .from('integration_accounts')
    .update({ credentials: encryptCredentials(fresh), updated_at: new Date().toISOString() })
    .eq('id', data.id)
    .eq('updated_at', data.updated_at)
    .select('id')
    .maybeSingle()
  if (!saved) return connection(supabase)
  return { token: fresh, tenantId: data.account_key as string }
}

async function xero(supabase: SupabaseClient, path: string, method: 'GET' | 'POST', body?: unknown) {
  const { token, tenantId } = await connection(supabase)
  const response = await fetch(`${XERO_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Xero-tenant-id': tenantId,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  if (response.status === 204) return {} as Record<string, any>
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Xero ${response.status}: ${detail.slice(0, 400)}`)
  }
  return (await response.json()) as Record<string, any>
}

function melbourneDate(value: string | null | undefined) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' }).format(
    value ? new Date(value) : new Date(),
  )
}

function quoted(value: string) {
  return value.replaceAll('\\', '').replaceAll('"', '\\"')
}

type JobForXero = {
  id: string
  public_reference: string
  service_family: string
  inspection_type: string | null
  new_home_stages: string[] | null
  payment_status: string
  paid_at: string | null
  quote_subtotal: number | string | null
  quote_total: number | string | null
  customer_snapshot: Record<string, string | null>
  property_snapshot: Record<string, string | null>
  intake_channel?: string | null
  translation_zh?: boolean | null
}

function describe(job: JobForXero) {
  const property = job.property_snapshot || {}
  const address = [property.address, property.suburb, property.postcode].filter(Boolean).join(', ')
  const service =
    job.intake_channel === 'report_transfer'
      ? 'Inspection report transfer'
      : job.service_family === 'new_home'
      ? `New home inspection (${(job.new_home_stages || []).map((stage) => STAGE_LABELS[stage] || stage).join(', ')})`
      : `${INSPECTION_TYPE_LABELS[job.inspection_type || ''] || 'Building'} inspection`
  return `${service}${job.translation_zh ? ' with Chinese translation' : ''} – ${address}`
}

async function findOrCreateContact(supabase: SupabaseClient, job: JobForXero) {
  const customer = job.customer_snapshot || {}
  const email = (customer.email || '').trim()
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(' ').trim() || email
  if (email) {
    const found = await xero(supabase, `/Contacts?where=${encodeURIComponent(`EmailAddress=="${quoted(email)}"`)}`, 'GET')
    const id = found.Contacts?.[0]?.ContactID
    if (id) return String(id)
  }
  // Contact names are unique in Xero: if the name is taken by someone else,
  // add the email to tell them apart.
  for (const candidate of [name, `${name} (${email})`]) {
    try {
      const created = await xero(supabase, '/Contacts', 'POST', {
        Contacts: [{ Name: candidate, FirstName: customer.first_name || '', LastName: customer.last_name || '', EmailAddress: email }],
      })
      const id = created.Contacts?.[0]?.ContactID
      if (id) return String(id)
    } catch (error) {
      if (!(error instanceof Error && /already|unique/i.test(error.message)) || candidate !== name) throw error
    }
  }
  throw new Error('Xero did not create the contact.')
}

// Creates (once) the paid invoice for a job and emails it to the customer.
// Every step is saved, so a retry carries on where it stopped and never adds
// a second invoice or payment.
export async function createPaidXeroInvoice(supabase: SupabaseClient, jobId: string) {
  const missing = xeroSetupMissing()
  if (missing.length) throw new Error(`Xero is not set up: ${missing.join(', ')}.`)

  const { data: job, error } = await supabase
    .from('jobs')
    .select(
      // All columns: newer ones (translation) may not exist on every database yet.
      '*',
    )
    .eq('id', jobId)
    .single()
  if (error || !job) throw new Error('Job not found.')
  const order = job as JobForXero
  if (order.payment_status !== 'paid') throw new Error('Only paid jobs are sent to Xero.')

  const subtotal = Number(order.quote_subtotal)
  const total = Number(order.quote_total)
  if (!(subtotal > 0) || !(total > 0)) throw new Error('The job has no price to invoice.')

  const { data: existing } = await supabase.from('xero_records').select('*').eq('job_id', jobId).maybeSingle()
  const record: Record<string, any> = { job_id: jobId, ...(existing || {}) }
  const save = async (fields: Record<string, unknown>) => {
    Object.assign(record, fields)
    await supabase
      .from('xero_records')
      .upsert({ ...record, updated_at: new Date().toISOString() }, { onConflict: 'job_id' })
  }
  const date = melbourneDate(order.paid_at)

  if (!record.contact_id) await save({ contact_id: await findOrCreateContact(supabase, order) })

  if (!record.invoice_id) {
    const found = await xero(
      supabase,
      `/Invoices?where=${encodeURIComponent(`Reference=="${quoted(order.public_reference)}"`)}`,
      'GET',
    )
    let invoice = (found.Invoices || []).find((item: any) => item.Status !== 'VOIDED' && item.Status !== 'DELETED')
    if (!invoice) {
      const brandingTheme = process.env.XERO_BRANDING_THEME_ID?.trim()
      const created = await xero(supabase, '/Invoices', 'POST', {
        Invoices: [
          {
            Type: 'ACCREC',
            Contact: { ContactID: record.contact_id },
            Date: date,
            DueDate: date,
            Reference: order.public_reference,
            LineAmountTypes: 'Exclusive',
            ...(brandingTheme ? { BrandingThemeID: brandingTheme } : {}),
            LineItems: [
              {
                Description: describe(order),
                Quantity: 1,
                UnitAmount: subtotal,
                AccountCode: process.env.XERO_SALES_ACCOUNT_CODE,
                TaxType: process.env.XERO_SALES_TAX_TYPE || 'OUTPUT',
              },
            ],
            Status: 'AUTHORISED',
          },
        ],
      })
      invoice = created.Invoices?.[0]
      if (!invoice?.InvoiceID) throw new Error('Xero did not return the invoice.')
      if (Math.abs(Number(invoice.Total) - total) > 0.01) {
        throw new Error(
          `The Xero invoice total ${Number(invoice.Total).toFixed(2)} does not match the payment ${total.toFixed(2)}. Check the tax setting before the payment is added.`,
        )
      }
    }
    await save({ invoice_id: String(invoice.InvoiceID), invoice_number: invoice.InvoiceNumber || null })
  }

  if (!record.payment_id) {
    const paid = await xero(supabase, '/Payments', 'POST', {
      Payments: [
        {
          Invoice: { InvoiceID: record.invoice_id },
          Account: { Code: process.env.XERO_PAYMENT_ACCOUNT_CODE },
          Date: date,
          Amount: total,
          Reference: `Stripe ${order.public_reference}`,
        },
      ],
    })
    const paymentId = paid.Payments?.[0]?.PaymentID
    if (!paymentId) throw new Error('Xero did not return the payment.')
    await save({ payment_id: String(paymentId) })
  }

  // Saved before emailing, so a failed email never adds a second payment.
  await save({ synced_at: new Date().toISOString(), last_error: null })

  const email = (order.customer_snapshot?.email || '').trim()
  if (!record.emailed_at && email && process.env.XERO_EMAIL_INVOICES !== 'false') {
    const current = await xero(supabase, `/Invoices/${record.invoice_id}`, 'GET')
    if (current.Invoices?.[0]?.SentToContact !== true) {
      await xero(supabase, `/Invoices/${record.invoice_id}/Email`, 'POST', {})
    }
    await save({ emailed_at: new Date().toISOString() })
  }
  return record
}

// For automatic use after payment: never throws, records what went wrong.
export async function syncJobToXero(supabase: SupabaseClient, jobId: string) {
  if (xeroSetupMissing().length) return { ok: false as const, error: 'Xero is not set up.' }
  try {
    await createPaidXeroInvoice(supabase, jobId)
    return { ok: true as const }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Xero sync failed.'
    const { data } = await supabase.from('xero_records').select('attempts').eq('job_id', jobId).maybeSingle()
    await supabase.from('xero_records').upsert(
      {
        job_id: jobId,
        attempts: Number(data?.attempts || 0) + 1,
        last_error: message.slice(0, 1000),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'job_id' },
    )
    console.error('xero_sync_failed', { jobId, message })
    return { ok: false as const, error: message }
  }
}
