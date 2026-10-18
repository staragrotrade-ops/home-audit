// Google Ads: the account tag, the quote conversion and the ad attribution
// saved with each quote. No imports, so the tests can load this file directly.

// Public identifiers from the Home Audit Google Ads account (551-924-7556).
// They can be overridden per environment, but the tag only ever loads on the
// production site (see components/analytics.tsx).
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18520017169'
export const GOOGLE_ADS_QUOTE_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_QUOTE_LABEL || 'vEi7CLqj96AdEJGShP9E'

export function isGoogleAdsId(value: string) {
  return /^AW-\d{6,15}$/.test(value)
}

export type AdAttribution = {
  first_landing_url: string
  first_referrer: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_term: string
  utm_content: string
  google_click_id: string
}

export const emptyAdAttribution: AdAttribution = {
  first_landing_url: '',
  first_referrer: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_term: '',
  utm_content: '',
  google_click_id: '',
}

export const AD_ATTRIBUTION_KEY = 'home-audit-first-attribution-v1'
// A saved source is forgotten after 90 days, the longest conversion window
// worth importing into Google Ads.
export const AD_ATTRIBUTION_DAYS = 90

type Stored = AdAttribution & { saved_at?: number }

// gclid is the normal Google Ads click id. iPhone app and some browser traffic
// arrives with gbraid or wbraid instead; those are kept in the same column with
// a prefix so an offline upload can tell them apart.
export function clickIdFrom(params: URLSearchParams) {
  const gclid = (params.get('gclid') || '').trim()
  if (gclid) return gclid.slice(0, 300)
  const gbraid = (params.get('gbraid') || '').trim()
  if (gbraid) return `gbraid:${gbraid}`.slice(0, 300)
  const wbraid = (params.get('wbraid') || '').trim()
  if (wbraid) return `wbraid:${wbraid}`.slice(0, 300)
  return ''
}

function fromUrl(href: string, referrer: string): AdAttribution {
  const url = new URL(href)
  const params = url.searchParams
  const text = (name: string, max: number) => (params.get(name) || '').trim().slice(0, max)
  return {
    first_landing_url: url.href.slice(0, 1000),
    first_referrer: (referrer || '').slice(0, 1000),
    utm_source: text('utm_source', 180),
    utm_medium: text('utm_medium', 180),
    utm_campaign: text('utm_campaign', 180),
    utm_term: text('utm_term', 180),
    utm_content: text('utm_content', 180),
    google_click_id: clickIdFrom(params),
  }
}

// Decides which source to keep for this browser.
// - Nothing saved (or the saved one is older than 90 days): this visit.
// - A visit from a new ad click replaces what was saved, so the click that
//   led to the quote is the one sent to Google Ads.
// - Otherwise the first saved source is kept.
// Returns `save: true` when the result should be written back.
export function nextAdAttribution(
  stored: Stored | null,
  href: string,
  referrer: string,
  now = Date.now(),
): { attribution: AdAttribution; save: boolean } {
  let visit: AdAttribution
  try {
    visit = fromUrl(href, referrer)
  } catch {
    visit = { ...emptyAdAttribution }
  }

  const fresh =
    stored !== null &&
    (typeof stored.saved_at !== 'number' ||
      now - stored.saved_at < AD_ATTRIBUTION_DAYS * 86_400_000)

  if (!fresh || stored === null) return { attribution: visit, save: true }

  const { saved_at: _savedAt, ...kept } = stored
  const keptAttribution = { ...emptyAdAttribution, ...kept }
  if (visit.google_click_id && visit.google_click_id !== keptAttribution.google_click_id) {
    return { attribution: visit, save: true }
  }
  return { attribution: keptAttribution, save: false }
}

// Browser only. Reads and updates the saved source; called on every page by
// the visitor tracker and again by the quote form.
export function captureAdAttribution(): AdAttribution {
  if (typeof window === 'undefined') return { ...emptyAdAttribution }
  try {
    let stored: Stored | null = null
    const raw = window.localStorage.getItem(AD_ATTRIBUTION_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') stored = parsed as Stored
      } catch {
        stored = null
      }
    }
    const { attribution, save } = nextAdAttribution(stored, window.location.href, document.referrer)
    if (save) {
      window.localStorage.setItem(
        AD_ATTRIBUTION_KEY,
        JSON.stringify({ ...attribution, saved_at: Date.now() }),
      )
    }
    return attribution
  } catch {
    return { ...emptyAdAttribution }
  }
}

type Gtag = (...args: unknown[]) => void

// Reports one submitted Building & Pest quote to Google Ads. Resolves when
// Google confirms, or after one second, so a redirect can follow safely.
// The quote reference is the transaction id, so the same quote is never
// counted twice.
export function reportQuoteConversion(reference: string): Promise<void> {
  return new Promise((resolve) => {
    const gtag = typeof window === 'undefined' ? undefined : (window as { gtag?: Gtag }).gtag
    if (!gtag || !reference || !isGoogleAdsId(GOOGLE_ADS_ID) || !GOOGLE_ADS_QUOTE_LABEL) {
      resolve()
      return
    }
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve()
    }
    window.setTimeout(finish, 1000)
    try {
      gtag('event', 'conversion', {
        send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_QUOTE_LABEL}`,
        transaction_id: reference,
        event_callback: finish,
      })
    } catch {
      finish()
    }
  })
}
