// Google Calendar event for a booked job. No imports, so the tests can load
// this file directly. Works like the 137B site's calendar events.

// Owner decision 15 October 2026: each job takes 1.5 hours.
export const DEFAULT_INSPECTION_MINUTES = 90

export type CalendarEventInput = {
  reference: string
  service: string
  address: string
  suburb: string
  postcode: string
  start: string
  end: string | null
  paymentStatus: string
  totalCents: number | null
  clientName: string
  phone: string
  email: string
  buyerSituation: string
  access: string
  agent: string
  notes: string
  adminUrl: string
}

const line = (name: string, value: string | null | undefined) => (value && value.trim() ? `${name}: ${value.trim()}` : null)

function aud(cents: number | null) {
  if (cents == null) return null
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents / 100)
}

export function eventEnd(start: string, end: string | null, minutes = DEFAULT_INSPECTION_MINUTES) {
  if (end && new Date(end).getTime() > new Date(start).getTime()) return new Date(end).toISOString()
  return new Date(new Date(start).getTime() + minutes * 60_000).toISOString()
}

// Calendar event ids may use the letters a-v and digits; a job's uuid in hex
// with an "ha" prefix gives one fixed id per job, so a retry never duplicates.
export function calendarEventId(jobId: string) {
  return `ha${jobId.toLowerCase().replace(/[^0-9a-f]/g, '')}`
}

export function buildCalendarEvent(input: CalendarEventInput) {
  const fullAddress = [input.address, [input.suburb, input.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const payment = [input.paymentStatus.toUpperCase(), aud(input.totalCents) ? `${aud(input.totalCents)} incl. GST` : null]
    .filter(Boolean)
    .join(' – ')
  const description = [
    line('Job', input.reference),
    line('Service', input.service),
    line('Property', fullAddress),
    line('Payment', payment),
    line('Client', input.clientName),
    line('Phone', input.phone),
    line('Email', input.email),
    line('Buyer', input.buyerSituation),
    line('Access', input.access),
    line('Agent', input.agent),
    line('Notes', input.notes),
    line('Dashboard', input.adminUrl),
  ]
    .filter(Boolean)
    .join('\n')

  return {
    summary: `HA – ${(input.suburb || input.address || 'Inspection').toUpperCase()}`,
    location: fullAddress,
    description,
    start: { dateTime: new Date(input.start).toISOString(), timeZone: 'Australia/Melbourne' },
    end: { dateTime: eventEnd(input.start, input.end), timeZone: 'Australia/Melbourne' },
  }
}
