// Victorian business days (Monday to Friday, excluding state-wide public
// holidays). Source: business.vic.gov.au public holiday lists.
// Update this list each year; dates marked "provisional" are not confirmed yet.
export const VIC_PUBLIC_HOLIDAYS = new Set([
  '2026-11-03', // Melbourne Cup
  '2026-12-25', // Christmas Day
  '2026-12-28', // Boxing Day (additional holiday)
  '2027-01-01',
  '2027-01-26',
  '2027-03-08',
  '2027-03-26',
  '2027-03-29',
  '2027-06-14',
  '2027-09-24', // AFL Grand Final Friday (provisional)
  '2027-11-02',
  '2027-12-27',
  '2027-12-28',
])

// Today's date in Melbourne as YYYY-MM-DD.
export function melbourneToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Australia/Melbourne',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function isBusinessDay(isoDate: string) {
  const weekday = new Date(`${isoDate}T12:00:00Z`).getUTCDay()
  return weekday !== 0 && weekday !== 6 && !VIC_PUBLIC_HOLIDAYS.has(isoDate)
}

// The date that is `count` business days after `fromDate` (not counting it).
export function addBusinessDays(fromDate: string, count: number) {
  let date = fromDate
  let added = 0
  while (added < count) {
    date = addDays(date, 1)
    if (isBusinessDay(date)) added += 1
  }
  return date
}
