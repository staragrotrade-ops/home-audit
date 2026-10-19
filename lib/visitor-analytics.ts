// Browser-side visitor analytics. A visit is one browser tab session: the id
// lives in sessionStorage and nothing identifies a person. The only cookie is
// the referral code from a partner's ?ref= link (see lib/referrals.ts).

import { normaliseRefCode, REFERRAL_COOKIE, REFERRAL_DAYS } from './referrals.ts'
import { visitSource } from './google-ads.ts'

export type VisitorEventName =
  | 'page_view'
  | 'quote_started'
  | 'quote_step'
  | 'quote_submitted'
  | 'quote_email_handoff'
  | 'phone_clicked'
  | 'email_clicked'

type Attribution = {
  sessionId: string
  landingPath: string
  referrer: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  refCode?: string
}

const SESSION_KEY = 'ha_visit_v1'
export const EXCLUSION_KEY = 'ha_analytics_excluded_v1'
export const EXCLUDED_PATH_PREFIXES = ['/admin', '/api', '/order', '/booking']

export function isExcludedPath(pathname: string) {
  return EXCLUDED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function isAnalyticsExcluded() {
  try {
    return window.localStorage.getItem(EXCLUSION_KEY) === '1'
  } catch {
    return false
  }
}

export function setAnalyticsExcluded(excluded: boolean) {
  try {
    if (excluded) {
      window.localStorage.setItem(EXCLUSION_KEY, '1')
      window.sessionStorage.removeItem(SESSION_KEY)
    } else {
      window.localStorage.removeItem(EXCLUSION_KEY)
    }
  } catch {
    // Preferences must never break the page.
  }
}

// Saves the code from a referral link (?ref=CODE) for 90 days. A newer link
// replaces an older one. Works even when analytics is switched off.
export function captureReferral() {
  if (typeof window === 'undefined') return null
  try {
    const code = normaliseRefCode(new URLSearchParams(window.location.search).get('ref'))
    if (code) {
      const secure = window.location.protocol === 'https:' ? '; Secure' : ''
      document.cookie = `${REFERRAL_COOKIE}=${code}; Max-Age=${REFERRAL_DAYS * 86_400}; Path=/; SameSite=Lax${secure}`
    }
    return code
  } catch {
    return null
  }
}

export function savedReferral() {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(new RegExp(`(?:^|; )${REFERRAL_COOKIE}=([a-z0-9]{3,12})(?:;|$)`))
  return match ? match[1] : ''
}

export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16)
  })
}

function cleanReferrer(value: string) {
  if (!value) return ''
  try {
    const url = new URL(value)
    if (url.host === window.location.host) return ''
    return `${url.origin}${url.pathname}`.slice(0, 500)
  } catch {
    return ''
  }
}

export function getVisit(): Attribution | null {
  if (typeof window === 'undefined' || isAnalyticsExcluded()) return null
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as Attribution
      if (parsed?.sessionId) return parsed
    }
    const params = new URLSearchParams(window.location.search)
    // Google Ads visits are labelled "google_ads" (see lib/google-ads.ts).
    const { utmSource, utmMedium } = visitSource(params)
    const visit: Attribution = {
      sessionId: newId(),
      landingPath: window.location.pathname.slice(0, 300),
      referrer: cleanReferrer(document.referrer),
      utmSource,
      utmMedium,
      utmCampaign: (params.get('utm_campaign') || '').slice(0, 160),
      refCode: normaliseRefCode(params.get('ref')) || savedReferral(),
    }
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(visit))
    return visit
  } catch {
    return null
  }
}

export function currentVisitId() {
  return getVisit()?.sessionId || ''
}

function send(url: string, payload: unknown, beacon = false) {
  const body = JSON.stringify(payload)
  try {
    if (beacon && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
      return
    }
    void fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // Analytics must never interrupt the visitor.
  }
}

export function trackVisitorEvent(
  eventName: VisitorEventName,
  options: { eventKey?: string; path?: string; metadata?: Record<string, string | number | boolean> } = {},
) {
  if (typeof window === 'undefined') return
  const path = options.path || window.location.pathname
  if (isExcludedPath(path)) return
  const visit = getVisit()
  if (!visit) return
  send('/api/analytics/event', {
    eventName,
    eventKey: (options.eventKey || '').slice(0, 120),
    path: path.slice(0, 300),
    visit,
    metadata: options.metadata || {},
    website: '',
  })
}

export function recordPageActivity(
  payload: {
    action: 'start' | 'heartbeat' | 'visibility' | 'exit'
    pageInstanceId: string
    path: string
    activeSeconds?: number
    exitReason?: string
  },
  beacon = false,
) {
  const visit = getVisit()
  if (!visit) return
  send('/api/analytics/activity', { ...payload, sessionId: visit.sessionId }, beacon)
}
