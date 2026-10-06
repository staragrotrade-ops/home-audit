'use client'

import { useEffect, useMemo, useState } from 'react'
import type { QuoteRequest } from '@/lib/quote-schema'
import { CONTACT_EMAIL } from '@/lib/site'

type ServiceFamily = QuoteRequest['service_family'] | ''
type Draft = Omit<QuoteRequest, 'service_family' | 'privacy_consent'> & {
  service_family: ServiceFamily
  privacy_consent: boolean
}

type Attribution = QuoteRequest['attribution']

type Status = {
  type: 'info' | 'error' | 'success'
  message: string
  details?: string[]
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const LEGACY_DRAFT_KEY = 'home-audit-quote-draft-v1'
const DRAFT_KEY = 'home-audit-quote-draft-v2'
const ATTRIBUTION_KEY = 'home-audit-first-attribution-v1'
// Saved contact and address details are removed from the device after a week.
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const emptyAttribution: Attribution = {
  first_landing_url: '',
  first_referrer: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_term: '',
  utm_content: '',
  google_click_id: '',
}

const emptyDraft: Draft = {
  service_family: '',
  inspection_type: '',
  new_home_stages: [],
  property_address: '',
  suburb: '',
  postcode: '',
  property_type: '',
  storeys: '',
  bedrooms: '',
  bathrooms: '',
  builder_name: '',
  expected_ready_date: '',
  first_name: '',
  last_name: '',
  email: '',
  mobile: '',
  conveyancer_email: '',
  agent_email: '',
  preferred_date_1: '',
  preferred_date_2: '',
  deadline: '',
  flexible_booking: false,
  access_contact: '',
  access_notes: '',
  source_self_reported: '',
  attribution: emptyAttribution,
  privacy_consent: false,
  website: '',
}

const existingTypes = [
  ['building_and_pest', 'Building & pest', 'Combined existing-home inspection'],
  ['building_only', 'Building only', 'Building condition without timber-pest scope'],
  ['pre_auction', 'Pre-auction', 'Inspection requested before an auction'],
] as const

const newHomeStages = [
  ['slab', 'Slab stage'],
  ['frame', 'Frame stage'],
  ['pre_plaster', 'Pre-plaster'],
  ['fixing', 'Fixing stage'],
  ['pci', 'Practical completion / PCI'],
] as const

// Where each field lives, so server-side validation errors can be shown in
// plain words and the form can return to the right section.
const fieldInfo: Record<string, { label: string; step: number }> = {
  service_family: { label: 'Inspection', step: 0 },
  inspection_type: { label: 'Inspection type', step: 0 },
  new_home_stages: { label: 'Construction stage', step: 0 },
  property_address: { label: 'Property address', step: 1 },
  suburb: { label: 'Suburb', step: 1 },
  postcode: { label: 'Postcode', step: 1 },
  property_type: { label: 'Property type', step: 1 },
  storeys: { label: 'Storeys', step: 1 },
  bedrooms: { label: 'Bedrooms', step: 1 },
  bathrooms: { label: 'Bathrooms', step: 1 },
  builder_name: { label: 'Builder', step: 1 },
  expected_ready_date: { label: 'Expected inspection-ready date', step: 1 },
  first_name: { label: 'First name', step: 2 },
  last_name: { label: 'Last name', step: 2 },
  email: { label: 'Email', step: 2 },
  mobile: { label: 'Mobile', step: 2 },
  conveyancer_email: { label: 'Conveyancer / solicitor email', step: 2 },
  agent_email: { label: 'Agent email', step: 2 },
  preferred_date_1: { label: 'Preferred date', step: 3 },
  preferred_date_2: { label: 'Second preference', step: 3 },
  deadline: { label: 'Auction / contract deadline', step: 3 },
  access_contact: { label: 'Access contact', step: 3 },
  access_notes: { label: 'Access or scope notes', step: 3 },
  privacy_consent: { label: 'Privacy notice', step: 3 },
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const mobilePattern = /^[0-9+() -]{8,40}$/

function track(event: string, params: Record<string, unknown> = {}) {
  try {
    window.gtag?.('event', event, params)
  } catch {
    // Analytics must never interrupt the form.
  }
}

function captureAttribution(): Attribution {
  const stored = window.localStorage.getItem(ATTRIBUTION_KEY)
  if (stored) {
    try {
      return { ...emptyAttribution, ...JSON.parse(stored) }
    } catch {
      window.localStorage.removeItem(ATTRIBUTION_KEY)
    }
  }

  const params = new URLSearchParams(window.location.search)
  const first = {
    first_landing_url: window.location.href,
    first_referrer: document.referrer,
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_term: params.get('utm_term') || '',
    utm_content: params.get('utm_content') || '',
    google_click_id: params.get('gclid') || '',
  }
  window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(first))
  return first
}

function readSavedDraft(): Partial<Draft> | null {
  // Drafts from the first release had no expiry; drop them.
  window.localStorage.removeItem(LEGACY_DRAFT_KEY)

  const saved = window.localStorage.getItem(DRAFT_KEY)
  if (!saved) return null

  try {
    const parsed = JSON.parse(saved) as { saved_at?: number; draft?: Partial<Draft> }
    const fresh =
      typeof parsed.saved_at === 'number' &&
      Date.now() - parsed.saved_at < DRAFT_MAX_AGE_MS

    if (fresh && parsed.draft && typeof parsed.draft === 'object') {
      return parsed.draft
    }
  } catch {
    // Fall through and remove the unreadable draft.
  }

  window.localStorage.removeItem(DRAFT_KEY)
  return null
}

function buildEmailHref(draft: Draft, stageLabels: string) {
  const inspection =
    draft.service_family === 'new_home'
      ? `New home — ${stageLabels || 'stage to be confirmed'}`
      : `Existing home — ${
          existingTypes.find(([value]) => value === draft.inspection_type)?.[1] ||
          'type to be confirmed'
        }`

  const lines = [
    `Inspection: ${inspection}`,
    `Property: ${[draft.property_address, draft.suburb, draft.postcode].filter(Boolean).join(', ')}`,
    draft.property_type && `Property type: ${draft.property_type.replace('_', ' / ')}`,
    draft.storeys && `Storeys: ${draft.storeys.replace('_plus', '+')}`,
    draft.bedrooms && `Bedrooms: ${draft.bedrooms}`,
    draft.bathrooms && `Bathrooms: ${draft.bathrooms}`,
    draft.builder_name && `Builder: ${draft.builder_name}`,
    draft.expected_ready_date && `Expected ready date: ${draft.expected_ready_date}`,
    '',
    `Name: ${draft.first_name} ${draft.last_name}`.trim(),
    `Email: ${draft.email}`,
    `Mobile: ${draft.mobile}`,
    draft.conveyancer_email && `Conveyancer / solicitor: ${draft.conveyancer_email}`,
    draft.agent_email && `Agent: ${draft.agent_email}`,
    '',
    draft.preferred_date_1 && `Preferred date: ${draft.preferred_date_1}`,
    draft.preferred_date_2 && `Second preference: ${draft.preferred_date_2}`,
    draft.deadline && `Auction / contract deadline: ${draft.deadline}`,
    draft.flexible_booking && 'Dates are flexible',
    draft.access_contact && `Access contact: ${draft.access_contact}`,
    draft.access_notes && `Notes: ${draft.access_notes}`,
  ].filter((line): line is string => typeof line === 'string')

  const subject = `Inspection quote request — ${draft.suburb || draft.property_address}`

  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    lines.join('\n').replace(/\n{3,}/g, '\n\n'),
  )}`
}

export function QuoteFlow({
  initialService,
  submissionEnabled,
}: {
  initialService: ServiceFamily
  submissionEnabled: boolean
}) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>({
    ...emptyDraft,
    service_family: initialService,
  })
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const saved = readSavedDraft()
    const attribution = captureAttribution()

    setDraft((current) => {
      const restored = saved ? { ...current, ...saved } : current
      const serviceFamily = initialService || restored.service_family

      return {
        ...restored,
        service_family: serviceFamily,
        // A service chosen from the link must not inherit the other
        // service's saved selections.
        inspection_type: serviceFamily === 'existing_home' ? restored.inspection_type : '',
        new_home_stages: serviceFamily === 'new_home' ? restored.new_home_stages : [],
        attribution,
        // Consent and the honeypot are never restored from storage.
        privacy_consent: false,
        website: '',
      }
    })
    setReady(true)
  }, [initialService])

  useEffect(() => {
    if (!ready || submitted) return

    const { privacy_consent: _consent, website: _website, ...persisted } = draft
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ saved_at: Date.now(), draft: persisted }),
    )
  }, [draft, ready, submitted])

  const stageLabels = useMemo(
    () =>
      newHomeStages
        .filter(([value]) => draft.new_home_stages.includes(value))
        .map(([, label]) => label)
        .join(', '),
    [draft.new_home_stages],
  )

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setStatus(null)
  }

  function selectService(family: QuoteRequest['service_family']) {
    if (draft.service_family === '') track('quote_start', { service_family: family })

    setDraft((current) =>
      current.service_family === family
        ? current
        : {
            ...current,
            service_family: family,
            // Selections belong to one service family only.
            inspection_type: '',
            new_home_stages: [],
            builder_name: '',
            expected_ready_date: '',
          },
    )
    setStatus(null)
  }

  function stepErrors(target: number): string[] {
    const errors: string[] = []

    if (target === 0) {
      if (!draft.service_family) errors.push('Choose an existing home or a new home.')
      else if (draft.service_family === 'existing_home' && !draft.inspection_type)
        errors.push('Choose an inspection type.')
      else if (draft.service_family === 'new_home' && draft.new_home_stages.length === 0)
        errors.push('Choose at least one construction stage.')
    }

    if (target === 1) {
      if (draft.property_address.trim().length < 5)
        errors.push('Enter the property address.')
      if (draft.postcode && !/^\d{4}$/.test(draft.postcode))
        errors.push('Postcode must be four digits, or left blank.')
    }

    if (target === 2) {
      if (!draft.first_name.trim()) errors.push('Enter your first name.')
      if (!draft.last_name.trim()) errors.push('Enter your last name.')
      if (!emailPattern.test(draft.email.trim()))
        errors.push('Enter a valid email address.')
      if (!mobilePattern.test(draft.mobile.trim()))
        errors.push('Enter a valid mobile number (digits, spaces and + only).')
      if (draft.conveyancer_email && !emailPattern.test(draft.conveyancer_email.trim()))
        errors.push('Check the conveyancer / solicitor email, or leave it blank.')
      if (draft.agent_email && !emailPattern.test(draft.agent_email.trim()))
        errors.push('Check the agent email, or leave it blank.')
    }

    if (target === 3) {
      if (!draft.privacy_consent)
        errors.push('Please confirm you have read the privacy notice.')
    }

    return errors
  }

  function showErrors(errors: string[]) {
    setStatus({
      type: 'error',
      message: 'Please check the following before continuing:',
      details: errors,
    })
  }

  function continueForward() {
    const errors = stepErrors(step)
    if (errors.length > 0) {
      showErrors(errors)
      return
    }
    setStatus(null)
    setStep((current) => Math.min(current + 1, 3))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearDraft() {
    window.localStorage.removeItem(DRAFT_KEY)
    setDraft({ ...emptyDraft, attribution: draft.attribution })
    setStep(0)
    setSubmitted(false)
    setStatus({ type: 'info', message: 'Saved details were removed from this device.' })
  }

  async function submit() {
    if (submitting || submitted) return

    // Re-check every section: a restored draft can skip earlier validation.
    for (const target of [0, 1, 2, 3]) {
      const errors = stepErrors(target)
      if (errors.length > 0) {
        setStep(target)
        showErrors(errors)
        return
      }
    }

    if (!submissionEnabled) {
      track('quote_email_handoff', { service_family: draft.service_family })
      window.location.href = buildEmailHref(draft, stageLabels)
      setStatus({
        type: 'info',
        message: `Your email app should open with these details ready to send. If it does not, email ${CONTACT_EMAIL} with the property address and inspection needed.`,
      })
      return
    }

    setSubmitting(true)
    setStatus(null)
    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          email: draft.email.trim(),
          mobile: draft.mobile.trim(),
          conveyancer_email: (draft.conveyancer_email || '').trim(),
          agent_email: (draft.agent_email || '').trim(),
        }),
      })
      const result = (await response.json().catch(() => ({}))) as {
        error?: string
        reference?: string | null
        issues?: Record<string, string[] | undefined>
      }

      if (!response.ok) {
        const fields = Object.keys(result.issues || {})
        if (fields.length > 0) {
          const firstStep = Math.min(...fields.map((field) => fieldInfo[field]?.step ?? 3))
          setStep(firstStep)
          setStatus({
            type: 'error',
            message: result.error || 'Please check the information below.',
            details: fields.map((field) => {
              const label = fieldInfo[field]?.label || field
              const reason = result.issues?.[field]?.[0]
              return reason ? `${label}: ${reason}` : label
            }),
          })
          return
        }
        throw new Error(result.error || 'Unable to submit request.')
      }

      window.localStorage.removeItem(DRAFT_KEY)
      setSubmitted(true)
      track('quote_submit', { service_family: draft.service_family })
      setStatus({
        type: 'success',
        message: result.reference
          ? `Request received. Your reference is ${result.reference}.`
          : 'Request received. We will review the details and contact you.',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Unable to submit the request. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="quote-shell">
        <div className="quote-panel quote-success">
          <h2>Thank you — your request is with us.</h2>
          {status && (
            <div className="quote-status" data-type="success" role="status">
              {status.message}
            </div>
          )}
          <p>
            We will review the details and reply by email or phone. Questions in
            the meantime? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <button className="button button-secondary" type="button" onClick={clearDraft}>
            Start another request
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="quote-shell">
      <div className="quote-nav" aria-label="Quote sections">
        {['Inspection', 'Property', 'Contact', 'Timing'].map((label, index) => (
          <span key={label} data-active={index === step} aria-current={index === step ? 'step' : undefined}>
            {label}
          </span>
        ))}
      </div>

      <div className="quote-panel">
        {step === 0 && (
          <>
            <div className="quote-panel-heading">
              <h2>What do you need inspected?</h2>
              <p>Choose the property journey first. The next questions will adapt to it.</p>
            </div>

            <div className="choice-grid">
              <button
                className="choice-card"
                type="button"
                data-selected={draft.service_family === 'existing_home'}
                aria-pressed={draft.service_family === 'existing_home'}
                onClick={() => selectService('existing_home')}
              >
                <em aria-hidden="true">✓</em>
                <strong>Existing home</strong>
                <span>Buying, bidding on or reviewing an established property.</span>
              </button>
              <button
                className="choice-card"
                type="button"
                data-selected={draft.service_family === 'new_home'}
                aria-pressed={draft.service_family === 'new_home'}
                onClick={() => selectService('new_home')}
              >
                <em aria-hidden="true">✓</em>
                <strong>New home</strong>
                <span>Construction stage or practical completion inspection.</span>
              </button>
              <a className="choice-card" href="https://ownerbuilderinspection.melbourne">
                <strong>Owner Builder 137B</strong>
                <span>Open the dedicated 137B eligibility and quote service.</span>
              </a>
            </div>

            {draft.service_family === 'existing_home' && (
              <div className="field-full" style={{ marginTop: 26 }}>
                <span className="fieldset-label">Inspection type</span>
                <div className="choice-grid">
                  {existingTypes.map(([value, title, description]) => (
                    <button
                      key={value}
                      className="choice-card"
                      type="button"
                      data-selected={draft.inspection_type === value}
                      aria-pressed={draft.inspection_type === value}
                      onClick={() => update('inspection_type', value)}
                    >
                      <em aria-hidden="true">✓</em>
                      <strong>{title}</strong>
                      <span>{description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {draft.service_family === 'new_home' && (
              <div className="field-full" style={{ marginTop: 26 }}>
                <span className="fieldset-label">Construction stage</span>
                <div className="checkbox-grid">
                  {newHomeStages.map(([value, label]) => (
                    <label className="checkbox-option" key={value}>
                      <input
                        type="checkbox"
                        checked={draft.new_home_stages.includes(value)}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...draft.new_home_stages, value]
                            : draft.new_home_stages.filter((item) => item !== value)
                          update('new_home_stages', next)
                        }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <div className="quote-panel-heading">
              <h2>Tell us about the property</h2>
              <p>
                {draft.service_family === 'new_home'
                  ? `Selected: ${stageLabels || 'new home inspection'}.`
                  : 'These details help determine scope, travel and inspection time.'}
              </p>
            </div>
            <div className="field-grid">
              <div className="field-full">
                <label htmlFor="property_address">Property address *</label>
                <input
                  id="property_address"
                  required
                  autoComplete="street-address"
                  value={draft.property_address}
                  onChange={(event) => update('property_address', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="suburb">Suburb</label>
                <input
                  id="suburb"
                  value={draft.suburb}
                  onChange={(event) => update('suburb', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="postcode">Postcode</label>
                <input
                  id="postcode"
                  inputMode="numeric"
                  maxLength={4}
                  value={draft.postcode}
                  onChange={(event) => update('postcode', event.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="field">
                <label htmlFor="property_type">Property type</label>
                <select
                  id="property_type"
                  value={draft.property_type}
                  onChange={(event) =>
                    update('property_type', event.target.value as Draft['property_type'])
                  }
                >
                  <option value="">Choose</option>
                  <option value="house">House</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="unit_apartment">Unit / apartment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="storeys">Storeys</label>
                <select
                  id="storeys"
                  value={draft.storeys}
                  onChange={(event) =>
                    update('storeys', event.target.value as Draft['storeys'])
                  }
                >
                  <option value="">Choose</option>
                  <option value="1">Single storey</option>
                  <option value="2">Two storeys</option>
                  <option value="3_plus">Three or more</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="bedrooms">Bedrooms</label>
                <input
                  id="bedrooms"
                  inputMode="numeric"
                  value={draft.bedrooms}
                  onChange={(event) => update('bedrooms', event.target.value.replace(/\D/g, '').slice(0, 2))}
                />
              </div>
              <div className="field">
                <label htmlFor="bathrooms">Bathrooms</label>
                <input
                  id="bathrooms"
                  inputMode="numeric"
                  value={draft.bathrooms}
                  onChange={(event) => update('bathrooms', event.target.value.replace(/\D/g, '').slice(0, 2))}
                />
              </div>

              {draft.service_family === 'new_home' && (
                <>
                  <div className="field">
                    <label htmlFor="builder_name">Builder</label>
                    <input
                      id="builder_name"
                      value={draft.builder_name}
                      onChange={(event) => update('builder_name', event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="expected_ready_date">Expected inspection-ready date</label>
                    <input
                      id="expected_ready_date"
                      type="date"
                      value={draft.expected_ready_date}
                      onChange={(event) => update('expected_ready_date', event.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="quote-panel-heading">
              <h2>Your contact details</h2>
              <p>We use these details only to prepare and manage your inspection request.</p>
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="first_name">First name *</label>
                <input
                  id="first_name"
                  required
                  autoComplete="given-name"
                  value={draft.first_name}
                  onChange={(event) => update('first_name', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="last_name">Last name *</label>
                <input
                  id="last_name"
                  required
                  autoComplete="family-name"
                  value={draft.last_name}
                  onChange={(event) => update('last_name', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  required
                  type="email"
                  autoComplete="email"
                  value={draft.email}
                  onChange={(event) => update('email', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="mobile">Mobile *</label>
                <input
                  id="mobile"
                  required
                  type="tel"
                  autoComplete="tel"
                  value={draft.mobile}
                  onChange={(event) => update('mobile', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="conveyancer_email">Conveyancer / solicitor email</label>
                <input
                  id="conveyancer_email"
                  type="email"
                  value={draft.conveyancer_email || ''}
                  onChange={(event) => update('conveyancer_email', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="agent_email">Agent email</label>
                <input
                  id="agent_email"
                  type="email"
                  value={draft.agent_email || ''}
                  onChange={(event) => update('agent_email', event.target.value)}
                />
              </div>
              <div className="field" aria-hidden="true" style={{ position: 'absolute', left: '-10000px' }}>
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={draft.website}
                  onChange={(event) => update('website', event.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="quote-panel-heading">
              <h2>Timing and access</h2>
              <p>Dates are preferences until the appointment is confirmed.</p>
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="preferred_date_1">Preferred date</label>
                <input
                  id="preferred_date_1"
                  type="date"
                  value={draft.preferred_date_1}
                  onChange={(event) => update('preferred_date_1', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="preferred_date_2">Second preference</label>
                <input
                  id="preferred_date_2"
                  type="date"
                  value={draft.preferred_date_2}
                  onChange={(event) => update('preferred_date_2', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="deadline">Auction / contract deadline</label>
                <input
                  id="deadline"
                  type="date"
                  value={draft.deadline}
                  onChange={(event) => update('deadline', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="source_self_reported">How did you hear about us?</label>
                <select
                  id="source_self_reported"
                  value={draft.source_self_reported}
                  onChange={(event) => update('source_self_reported', event.target.value)}
                >
                  <option value="">Choose</option>
                  <option value="google">Google</option>
                  <option value="chatgpt_ai">ChatGPT or another AI assistant</option>
                  <option value="conveyancer">Conveyancer / solicitor</option>
                  <option value="agent">Real estate agent</option>
                  <option value="buyers_agent">Buyer&apos;s agent</option>
                  <option value="previous_customer">Previous customer / referral</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <label className="checkbox-option field-full">
                <input
                  type="checkbox"
                  checked={draft.flexible_booking}
                  onChange={(event) => update('flexible_booking', event.target.checked)}
                />
                My dates are flexible
              </label>
              <div className="field-full">
                <label htmlFor="access_contact">Agent, tenant or builder access contact</label>
                <input
                  id="access_contact"
                  value={draft.access_contact}
                  onChange={(event) => update('access_contact', event.target.value)}
                />
              </div>
              <div className="field-full">
                <label htmlFor="access_notes">Access or scope notes</label>
                <textarea
                  id="access_notes"
                  maxLength={1500}
                  value={draft.access_notes}
                  onChange={(event) => update('access_notes', event.target.value)}
                />
              </div>
              <label className="checkbox-option consent-option field-full">
                <input
                  type="checkbox"
                  checked={draft.privacy_consent}
                  onChange={(event) => update('privacy_consent', event.target.checked)}
                />
                <span>
                  I have read the{' '}
                  <a href="/privacy" target="_blank" rel="noopener">
                    privacy notice
                  </a>{' '}
                  and agree to my details being used to respond to this request. *
                </span>
              </label>
            </div>
          </>
        )}

        {status && (
          <div
            className="quote-status"
            data-type={status.type}
            role={status.type === 'error' ? 'alert' : 'status'}
          >
            {status.message}
            {status.details && status.details.length > 0 && (
              <ul>
                {status.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="quote-actions">
          {step > 0 ? (
            <button className="back-button" type="button" onClick={() => setStep((current) => current - 1)}>
              ← Back
            </button>
          ) : (
            <button className="link-button" type="button" onClick={clearDraft}>
              Clear saved details
            </button>
          )}
          {step < 3 ? (
            <button className="button" type="button" onClick={continueForward}>
              Continue
            </button>
          ) : (
            <button className="button" type="button" onClick={submit} disabled={submitting}>
              {submitting
                ? 'Sending…'
                : submissionEnabled
                  ? 'Submit for quote'
                  : 'Email this request'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
