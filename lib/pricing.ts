// Instant pricing rules for existing homes. Anything outside these rules goes
// to a manual price review by the owner.
import { addBusinessDays, melbourneToday } from './business-days.ts'

export const PRICING_VERSION = 'flat-550-v1'
export const INSTANT_PRICE_EX_GST_CENTS = 50_000
export const GST_RATE = 0.1
export const MAX_INSTANT_TRAVEL_MINUTES = 90
export const MIN_LEAD_BUSINESS_DAYS = 3

export type PricingInput = {
  serviceFamily: 'existing_home' | 'new_home'
  inspectionType: string
  priceGuideBand: '' | 'up_to_1_5m' | 'over_1_5m' | 'unknown'
  preferredDate: string
  deadline: string
  travelMinutes: number | null
  today?: string
}

export type PricingResult =
  | {
      decision: 'instant'
      subtotalCents: number
      gstCents: number
      totalCents: number
      reasons: []
      earliestDate: string
    }
  | { decision: 'manual'; reasons: string[]; earliestDate: string }

export function earliestInstantDate(today = melbourneToday()) {
  return addBusinessDays(today, MIN_LEAD_BUSINESS_DAYS)
}

export function gstFor(subtotalCents: number) {
  return Math.round(subtotalCents * GST_RATE)
}

export function priceQuote(input: PricingInput): PricingResult {
  const earliestDate = earliestInstantDate(input.today)
  const reasons: string[] = []

  if (input.serviceFamily === 'new_home') reasons.push('New home inspection')
  if (
    input.serviceFamily === 'existing_home' &&
    !['building_and_pest', 'building_only', 'pre_auction'].includes(input.inspectionType)
  ) {
    reasons.push('Inspection type not chosen')
  }
  if (input.serviceFamily === 'existing_home' && input.priceGuideBand !== 'up_to_1_5m') {
    reasons.push(
      input.priceGuideBand === 'over_1_5m' ? 'Price guide over $1.5m' : 'Price guide not known',
    )
  }
  if (input.travelMinutes === null) reasons.push('Travel time could not be checked')
  else if (input.travelMinutes > MAX_INSTANT_TRAVEL_MINUTES) {
    reasons.push(`About ${Math.round(input.travelMinutes)} minutes' drive from Mount Eliza`)
  }
  if (input.preferredDate && input.preferredDate < earliestDate) {
    reasons.push('Preferred date is within 3 business days')
  }
  if (input.deadline && input.deadline < earliestDate) {
    reasons.push('Deadline is within 3 business days')
  }

  if (reasons.length > 0) return { decision: 'manual', reasons, earliestDate }

  const subtotalCents = INSTANT_PRICE_EX_GST_CENTS
  const gstCents = gstFor(subtotalCents)
  return {
    decision: 'instant',
    subtotalCents,
    gstCents,
    totalCents: subtotalCents + gstCents,
    reasons: [],
    earliestDate,
  }
}

export function formatAud(cents: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100)
}
