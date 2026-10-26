const TIME_ZONE = 'Australia/Melbourne'

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00Z`) : new Date(value)
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds || 0))
  if (total < 60) return `${total}s`
  const minutes = Math.floor(total / 60)
  if (minutes < 60) return `${minutes}m ${String(total % 60).padStart(2, '0')}s`
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

export function percent(part: number, whole: number) {
  if (!whole) return '—'
  return `${((part / whole) * 100).toFixed(part / whole < 0.1 ? 1 : 0)}%`
}

export function melbourneDay(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  return parts // YYYY-MM-DD
}

export const INSPECTION_TYPE_LABELS: Record<string, string> = {
  building_and_pest: 'Building & pest',
  building_only: 'Building only',
  pre_auction: 'Pre-auction',
}

export const STAGE_LABELS: Record<string, string> = {
  slab: 'Pre-slab',
  frame: 'Frame',
  pre_plaster: 'Pre-plaster',
  fixing: 'Fixing',
  pci: 'PCI / handover',
}

export const CHANNEL_LABELS: Record<string, string> = {
  web_form: 'Online form',
  email_handoff: 'Form → email app',
  phone: 'Phone',
  app_manual: 'Inspector app',
  report_transfer: 'Report transfer (QR)',
}

export function cleanSearch(value: string | undefined) {
  return (value || '')
    .replace(/[^\p{L}\p{N}@.+\- ]/gu, '')
    .trim()
    .slice(0, 60)
}
