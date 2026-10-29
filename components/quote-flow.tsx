'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { QuoteRequest } from '@/lib/quote-schema'
import { PRICE_GUIDE_BANDS } from '@/lib/booking-options'
import { earliestInstantDate } from '@/lib/pricing'
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/lib/site'
import { currentVisitId, trackVisitorEvent } from '@/lib/visitor-analytics'
import { Turnstile } from '@/components/turnstile'
import { isRedirectLink } from '@/lib/listing-url'
import { captureAdAttribution, reportQuoteConversion } from '@/lib/google-ads'
import { QUOTE_COPY, translateServerMessage, type QuoteLang } from '@/lib/quote-copy'

type ServiceFamily = QuoteRequest['service_family'] | ''
type Draft = Omit<
  QuoteRequest,
  | 'service_family'
  | 'privacy_consent'
  | 'intake_mode'
  | 'analytics_session_id'
  | 'turnstile_token'
  | 'form_language'
> & {
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
  price_guide_band: '',
  listing_url: '',
  builder_name: '',
  expected_ready_date: '',
  first_name: '',
  last_name: '',
  email: '',
  mobile: '',
  conveyancer_email: '',
  agent_email: '',
  agent_phone: '',
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
  voucher_code: '',
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
  price_guide_band: { label: 'Price guide', step: 1 },
  listing_url: { label: 'Listing link', step: 1 },
  builder_name: { label: 'Builder', step: 1 },
  expected_ready_date: { label: 'Expected inspection-ready date', step: 1 },
  first_name: { label: 'First name', step: 2 },
  last_name: { label: 'Last name', step: 2 },
  email: { label: 'Email', step: 2 },
  mobile: { label: 'Mobile', step: 2 },
  conveyancer_email: { label: 'Conveyancer / solicitor email', step: 2 },
  agent_email: { label: 'Agent email', step: 2 },
  agent_phone: { label: 'Agent phone', step: 2 },
  preferred_date_1: { label: 'Preferred date', step: 3 },
  preferred_date_2: { label: 'Second preference', step: 3 },
  deadline: { label: 'Auction / contract deadline', step: 3 },
  access_contact: { label: 'Access contact', step: 3 },
  access_notes: { label: 'Access or scope notes', step: 3 },
  privacy_consent: { label: 'Privacy notice', step: 3 },
  voucher_code: { label: 'Voucher code', step: 3 },
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const mobilePattern = /^[0-9+() -]{8,40}$/

const VISITOR_EVENTS = {
  quote_start: 'quote_started',
  quote_email_handoff: 'quote_email_handoff',
  quote_submit: 'quote_submitted',
} as const

function track(event: keyof typeof VISITOR_EVENTS, params: { service_family: string }) {
  try {
    window.gtag?.('event', event, params)
    trackVisitorEvent(VISITOR_EVENTS[event], {
      metadata: { service_family: params.service_family },
    })
  } catch {
    // Analytics must never interrupt the form.
  }
}

function requestBody(
  draft: Draft,
  intakeMode: 'submit' | 'email_handoff',
  turnstileToken = '',
  lang: QuoteLang = 'en',
) {
  return JSON.stringify({
    ...draft,
    email: draft.email.trim(),
    mobile: draft.mobile.trim(),
    conveyancer_email: (draft.conveyancer_email || '').trim(),
    agent_email: (draft.agent_email || '').trim(),
    agent_phone: (draft.agent_phone || '').trim(),
    form_language: lang,
    intake_mode: intakeMode,
    analytics_session_id: currentVisitId(),
    turnstile_token: turnstileToken,
  })
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

function formatShortDate(isoDate: string, locale = 'en-AU') {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T12:00:00Z`))
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
    draft.price_guide_band &&
      `Price guide: ${PRICE_GUIDE_BANDS.find(([value]) => value === draft.price_guide_band)?.[1] || ''}`,
    draft.listing_url && `Listing: ${draft.listing_url}`,
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
    draft.agent_email && `Agent email: ${draft.agent_email}`,
    draft.agent_phone && `Agent phone: ${draft.agent_phone}`,
    '',
    draft.preferred_date_1 && `Preferred date: ${draft.preferred_date_1}`,
    draft.preferred_date_2 && `Second preference: ${draft.preferred_date_2}`,
    draft.deadline && `Auction / contract deadline: ${draft.deadline}`,
    draft.flexible_booking && 'Dates are flexible',
    draft.access_notes && `Notes: ${draft.access_notes}`,
    draft.voucher_code && `Voucher code: ${draft.voucher_code}`,
  ].filter((line): line is string => typeof line === 'string')

  const subject = `Inspection quote request — ${draft.suburb || draft.property_address}`

  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    lines.join('\n').replace(/\n{3,}/g, '\n\n'),
  )}`
}

export function QuoteFlow({
  initialService,
  initialInspectionType = '',
  submissionEnabled,
  turnstileSiteKey = '',
  initialVoucherCode = '',
  lang = 'en',
}: {
  /** The language the customer reads. Values sent to the server are the same. */
  lang?: QuoteLang
  initialService: ServiceFamily
  // From the link in the 137B website's voucher email (/quote?voucher=…).
  initialVoucherCode?: string
  // Set by links such as /quote?service=building-and-pest, which then open
  // straight at the property questions.
  initialInspectionType?: Draft['inspection_type']
  submissionEnabled: boolean
  turnstileSiteKey?: string
}) {
  const t = QUOTE_COPY[lang]
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileReset, setTurnstileReset] = useState(0)
  const needsTurnstile = submissionEnabled && Boolean(turnstileSiteKey)
  const [step, setStep] = useState(0)
  // A visit that opens with the service already chosen counts as a started
  // quote at its first answer, not on page load.
  const startTracked = useRef(false)
  const [draft, setDraft] = useState<Draft>({
    ...emptyDraft,
    service_family: initialService,
  })
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<Status | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  // Worked out in the browser: the page itself is pre-rendered at build time.
  const [earliestDate, setEarliestDate] = useState('')
  useEffect(() => setEarliestDate(earliestInstantDate()), [])

  useEffect(() => {
    const saved = readSavedDraft()
    const attribution = captureAdAttribution()
    const presetType =
      initialService === 'existing_home' && initialInspectionType ? initialInspectionType : ''

    setDraft((current) => {
      const restored = saved ? { ...current, ...saved } : current
      const serviceFamily = initialService || restored.service_family

      return {
        ...restored,
        service_family: serviceFamily,
        // A service chosen from the link must not inherit the other
        // service's saved selections.
        inspection_type:
          presetType || (serviceFamily === 'existing_home' ? restored.inspection_type : ''),
        new_home_stages: serviceFamily === 'new_home' ? restored.new_home_stages : [],
        attribution,
        // Consent and the honeypot are never restored from storage.
        privacy_consent: false,
        website: '',
        voucher_code: initialVoucherCode || restored.voucher_code || '',
      }
    })
    if (presetType) setStep(1)
    setReady(true)
  }, [initialService, initialInspectionType, initialVoucherCode])

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
        .map(([value]) => t.stages[value])
        .join(lang === 'zh' ? '、' : ', '),
    [draft.new_home_stages, t, lang],
  )

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    if (!startTracked.current && draft.service_family) {
      startTracked.current = true
      track('quote_start', { service_family: draft.service_family })
    }
    setDraft((current) => ({ ...current, [key]: value }))
    setStatus(null)
  }

  function selectService(family: QuoteRequest['service_family']) {
    if (draft.service_family === '' && !startTracked.current) {
      startTracked.current = true
      track('quote_start', { service_family: family })
    }

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
      if (!draft.service_family) errors.push(t.errors.chooseFamily)
      else if (draft.service_family === 'existing_home' && !draft.inspection_type)
        errors.push(t.errors.chooseType)
      else if (draft.service_family === 'new_home' && draft.new_home_stages.length === 0)
        errors.push(t.errors.chooseStage)
    }

    if (target === 1) {
      if (draft.property_address.trim().length < 5)
        errors.push(t.errors.address)
      if (draft.postcode && !/^\d{4}$/.test(draft.postcode))
        errors.push(t.errors.postcode)
      if (draft.service_family === 'existing_home') {
        if (!draft.suburb.trim()) errors.push(t.errors.suburb)
        if (!draft.price_guide_band) errors.push(t.errors.priceGuide)
        if (draft.listing_url && !/^https?:\/\/\S+$/.test(draft.listing_url.trim()))
          errors.push(t.errors.listingUrl)
        else if (draft.listing_url && isRedirectLink(draft.listing_url))
          errors.push(t.errors.listingRedirect)
      }
    }

    if (target === 2) {
      if (!draft.first_name.trim()) errors.push(t.errors.firstName)
      if (!draft.last_name.trim()) errors.push(t.errors.lastName)
      if (!emailPattern.test(draft.email.trim()))
        errors.push(t.errors.email)
      if (!mobilePattern.test(draft.mobile.trim()))
        errors.push(t.errors.mobile)
      if (draft.conveyancer_email && !emailPattern.test(draft.conveyancer_email.trim()))
        errors.push(t.errors.conveyancerEmail)
      if (draft.agent_email && !emailPattern.test(draft.agent_email.trim()))
        errors.push(t.errors.agentEmail)
      if (draft.agent_phone && !/^[0-9+() -]{6,40}$/.test(draft.agent_phone.trim()))
        errors.push(t.errors.agentPhone)
    }

    if (target === 3) {
      if (!draft.privacy_consent)
        errors.push(t.errors.privacy)
    }

    return errors
  }

  function showErrors(errors: string[]) {
    setStatus({
      type: 'error',
      message: t.errors.checkBeforeContinuing,
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
    setStatus({ type: 'info', message: t.draftCleared })
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
      // Keep a copy for the admin dashboard in case the email is never sent.
      void fetch('/api/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: requestBody(draft, 'email_handoff', '', lang),
        keepalive: true,
      }).catch(() => undefined)
      window.location.href = buildEmailHref(
        draft,
        newHomeStages
          .filter(([value]) => draft.new_home_stages.includes(value))
          .map(([, label]) => label)
          .join(', '),
      )
      setStatus({
        type: 'info',
        message: t.emailHandoff(CONTACT_EMAIL),
      })
      return
    }

    setSubmitting(true)
    setStatus(null)
    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: requestBody(draft, 'submit', turnstileToken, lang),
      })
      const result = (await response.json().catch(() => ({}))) as {
        error?: string
        reference?: string | null
        decision?: 'instant' | 'manual'
        orderUrl?: string | null
        issues?: Record<string, string[] | undefined>
        voucher?: { applied: boolean; amountCents?: number } | null
      }

      if (!response.ok) {
        // A Turnstile token works once: get a new one before trying again.
        if (needsTurnstile) setTurnstileReset((value) => value + 1)
        const fields = Object.keys(result.issues || {})
        if (fields.length > 0) {
          const firstStep = Math.min(...fields.map((field) => fieldInfo[field]?.step ?? 3))
          setStep(firstStep)
          setStatus({
            type: 'error',
            message: result.error ? translateServerMessage(t, result.error) : t.errors.checkBelow,
            details: fields.map((field) => {
              const label = t.fields[field] || fieldInfo[field]?.label || field
              const reason = result.issues?.[field]?.[0]
              return reason ? `${label}: ${reason}` : label
            }),
          })
          return
        }
        throw new Error(result.error ? translateServerMessage(t, result.error) : t.errors.submitFailed)
      }

      window.localStorage.removeItem(DRAFT_KEY)
      track('quote_submit', { service_family: draft.service_family })
      // Google Ads counts submitted existing-home quotes only. A response
      // without a reference created no job, so it is never reported.
      if (draft.service_family === 'existing_home' && result.reference) {
        await reportQuoteConversion(result.reference)
      }
      // An instant price goes straight to the order page to pay.
      if (result.decision === 'instant' && result.orderUrl) {
        window.location.href = result.orderUrl
        return
      }
      setSubmitted(true)
      const voucherMessage = result.voucher
        ? result.voucher.applied
          ? t.voucherApplied(((result.voucher.amountCents || 0) / 100).toFixed(0))
          : t.voucherNotApplied
        : ''
      setStatus({
        type: 'success',
        message: `${t.received(result.reference || null)}${voucherMessage}`,
      })
    } catch (error) {
      setStatus({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : t.errors.submitFailed,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="quote-shell">
        <div className="quote-panel quote-success">
          <h2>{t.successTitle}</h2>
          {status && (
            <div className="quote-status" data-type="success" role="status">
              {status.message}
            </div>
          )}
          <p>
            {t.successBefore} <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a> {t.successOr}{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
          <button className="button button-secondary" type="button" onClick={clearDraft}>
            {t.startAnother}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="quote-shell">
      <div className="quote-nav" aria-label="Quote sections">
        {t.steps.map((label, index) => (
          <span key={label} data-active={index === step} aria-current={index === step ? 'step' : undefined}>
            {label}
          </span>
        ))}
      </div>

      <div className="quote-panel">
        {step === 0 && (
          <>
            <div className="quote-panel-heading">
              <h2>{t.step0Title}</h2>
              <p>{t.step0Intro}</p>
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
                <strong>{t.existingHome[0]}</strong>
                <span>{t.existingHome[1]}</span>
              </button>
              <button
                className="choice-card"
                type="button"
                data-selected={draft.service_family === 'new_home'}
                aria-pressed={draft.service_family === 'new_home'}
                onClick={() => selectService('new_home')}
              >
                <em aria-hidden="true">✓</em>
                <strong>{t.newHome[0]}</strong>
                <span>{t.newHome[1]}</span>
              </button>
              <a className="choice-card" href={t.ownerBuilderHref}>
                <strong>{t.ownerBuilder[0]}</strong>
                <span>{t.ownerBuilder[1]}</span>
              </a>
            </div>

            {draft.service_family === 'existing_home' && (
              <div className="field-full" style={{ marginTop: 26 }}>
                <span className="fieldset-label">{t.fields.inspection_type}</span>
                <div className="choice-grid">
                  {existingTypes.map(([value]) => (
                    <button
                      key={value}
                      className="choice-card"
                      type="button"
                      data-selected={draft.inspection_type === value}
                      aria-pressed={draft.inspection_type === value}
                      onClick={() => update('inspection_type', value)}
                    >
                      <em aria-hidden="true">✓</em>
                      <strong>{t.existingTypes[value][0]}</strong>
                      <span>{t.existingTypes[value][1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {draft.service_family === 'new_home' && (
              <div className="field-full" style={{ marginTop: 26 }}>
                <span className="fieldset-label">{t.fields.new_home_stages}</span>
                <div className="checkbox-grid">
                  {newHomeStages.map(([value]) => (
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
                      {t.stages[value]}
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
              <h2>{t.step1Title}</h2>
              <p>
                {draft.service_family === 'new_home'
                  ? t.step1Selected(stageLabels)
                  : t.step1Intro}
              </p>
            </div>
            <div className="field-grid">
              <div className="field-full">
                <label htmlFor="property_address">{t.fields.property_address} *</label>
                <input
                  id="property_address"
                  required
                  autoComplete="street-address"
                  value={draft.property_address}
                  onChange={(event) => update('property_address', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="suburb">{t.fields.suburb}</label>
                <input
                  id="suburb"
                  value={draft.suburb}
                  onChange={(event) => update('suburb', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="postcode">{t.fields.postcode}</label>
                <input
                  id="postcode"
                  inputMode="numeric"
                  maxLength={4}
                  value={draft.postcode}
                  onChange={(event) => update('postcode', event.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="field">
                <label htmlFor="property_type">{t.fields.property_type}</label>
                <select
                  id="property_type"
                  value={draft.property_type}
                  onChange={(event) =>
                    update('property_type', event.target.value as Draft['property_type'])
                  }
                >
                  <option value="">{t.choose}</option>
                  {(['house', 'townhouse', 'unit_apartment', 'other'] as const).map((value) => (
                    <option key={value} value={value}>
                      {t.propertyTypes[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="storeys">{t.fields.storeys}</label>
                <select
                  id="storeys"
                  value={draft.storeys}
                  onChange={(event) =>
                    update('storeys', event.target.value as Draft['storeys'])
                  }
                >
                  <option value="">{t.choose}</option>
                  {(['1', '2', '3_plus'] as const).map((value) => (
                    <option key={value} value={value}>
                      {t.storeyOptions[value]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="bedrooms">{t.fields.bedrooms}</label>
                <input
                  id="bedrooms"
                  inputMode="numeric"
                  value={draft.bedrooms}
                  onChange={(event) => update('bedrooms', event.target.value.replace(/\D/g, '').slice(0, 2))}
                />
              </div>
              <div className="field">
                <label htmlFor="bathrooms">{t.fields.bathrooms}</label>
                <input
                  id="bathrooms"
                  inputMode="numeric"
                  value={draft.bathrooms}
                  onChange={(event) => update('bathrooms', event.target.value.replace(/\D/g, '').slice(0, 2))}
                />
              </div>

              {draft.service_family === 'existing_home' && (
                <>
                  <div className="field">
                    <label htmlFor="price_guide_band">{t.priceGuideLabel}</label>
                    <select
                      id="price_guide_band"
                      value={draft.price_guide_band}
                      onChange={(event) =>
                        update('price_guide_band', event.target.value as Draft['price_guide_band'])
                      }
                    >
                      <option value="">{t.choose}</option>
                      {PRICE_GUIDE_BANDS.map(([value]) => (
                        <option key={value} value={value}>
                          {t.priceBands[value]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="listing_url">{t.fields.listing_url}</label>
                    <input
                      id="listing_url"
                      type="url"
                      inputMode="url"
                      placeholder="https://www.realestate.com.au/…"
                      value={draft.listing_url}
                      onChange={(event) => update('listing_url', event.target.value)}
                    />
                  </div>
                </>
              )}

              {draft.service_family === 'new_home' && (
                <>
                  <div className="field">
                    <label htmlFor="builder_name">{t.fields.builder_name}</label>
                    <input
                      id="builder_name"
                      value={draft.builder_name}
                      onChange={(event) => update('builder_name', event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="expected_ready_date">{t.fields.expected_ready_date}</label>
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
              <h2>{t.step2Title}</h2>
              <p>{t.step2Intro}</p>
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="first_name">{t.fields.first_name} *</label>
                <input
                  id="first_name"
                  required
                  autoComplete="given-name"
                  value={draft.first_name}
                  onChange={(event) => update('first_name', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="last_name">{t.fields.last_name} *</label>
                <input
                  id="last_name"
                  required
                  autoComplete="family-name"
                  value={draft.last_name}
                  onChange={(event) => update('last_name', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="email">{t.fields.email} *</label>
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
                <label htmlFor="mobile">{t.fields.mobile} *</label>
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
                <label htmlFor="conveyancer_email">{t.fields.conveyancer_email}</label>
                <input
                  id="conveyancer_email"
                  type="email"
                  value={draft.conveyancer_email || ''}
                  onChange={(event) => update('conveyancer_email', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="agent_email">{t.fields.agent_email}</label>
                <input
                  id="agent_email"
                  type="email"
                  value={draft.agent_email || ''}
                  onChange={(event) => update('agent_email', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="agent_phone">{t.fields.agent_phone}</label>
                <input
                  id="agent_phone"
                  type="tel"
                  value={draft.agent_phone || ''}
                  onChange={(event) => update('agent_phone', event.target.value)}
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
              <h2>{t.step3Title}</h2>
              <p>
                {t.step3Intro}
                {earliestDate && t.step3Earliest(formatShortDate(earliestDate, t.dateLocale))}
              </p>
            </div>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="preferred_date_1">{t.fields.preferred_date_1}</label>
                <input
                  id="preferred_date_1"
                  type="date"
                  value={draft.preferred_date_1}
                  onChange={(event) => update('preferred_date_1', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="preferred_date_2">{t.fields.preferred_date_2}</label>
                <input
                  id="preferred_date_2"
                  type="date"
                  value={draft.preferred_date_2}
                  onChange={(event) => update('preferred_date_2', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="deadline">{t.fields.deadline}</label>
                <input
                  id="deadline"
                  type="date"
                  value={draft.deadline}
                  onChange={(event) => update('deadline', event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="source_self_reported">{t.heardAbout}</label>
                <select
                  id="source_self_reported"
                  value={draft.source_self_reported}
                  onChange={(event) => update('source_self_reported', event.target.value)}
                >
                  <option value="">{t.choose}</option>
                  {Object.entries(t.sources).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="voucher_code">{t.voucherLabel}</label>
                <input
                  id="voucher_code"
                  value={draft.voucher_code}
                  maxLength={40}
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="HA30-XXXX-XXXX"
                  onChange={(event) => update('voucher_code', event.target.value)}
                />
              </div>
              <label className="checkbox-option field-full">
                <input
                  type="checkbox"
                  checked={draft.flexible_booking}
                  onChange={(event) => update('flexible_booking', event.target.checked)}
                />
                {t.flexible}
              </label>
              <div className="field-full">
                <label htmlFor="access_notes">{t.fields.access_notes}</label>
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
                  {t.privacyBefore}{lang === 'zh' ? '' : ' '}
                  <a href="/privacy" target="_blank" rel="noopener">
                    {t.privacyLink}
                  </a>
                  {lang === 'zh' ? '' : ' '}
                  {t.privacyAfter}
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

        {step === 3 && needsTurnstile && (
          <Turnstile siteKey={turnstileSiteKey} onToken={setTurnstileToken} resetKey={turnstileReset} />
        )}

        <div className="quote-actions">
          {step > 0 ? (
            <button className="back-button" type="button" onClick={() => setStep((current) => current - 1)}>
              {t.back}
            </button>
          ) : (
            <button className="link-button" type="button" onClick={clearDraft}>
              {t.clear}
            </button>
          )}
          {step < 3 ? (
            <button className="button" type="button" onClick={continueForward}>
              {t.continue}
            </button>
          ) : (
            <button
              className="button"
              type="button"
              onClick={submit}
              disabled={submitting || (needsTurnstile && !turnstileToken)}
            >
              {submitting
                ? t.checking
                : submissionEnabled
                  ? t.getPrice
                  : t.emailRequest}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
