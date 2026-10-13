// Proposed booking times must be in the future and no more than a year ahead.
// Returns one to three unique ISO times in order, or null. No imports, so the
// tests can load it directly.
export function validSlots(slots: string[], now = Date.now()) {
  const times = slots.map((slot) => new Date(slot).getTime())
  if (times.some((time) => !Number.isFinite(time))) return null
  const unique = [...new Set(times)].sort((a, b) => a - b)
  if (unique.length < 1 || unique.length > 3) return null
  if (unique.some((time) => time < now || time > now + 366 * 86_400_000)) return null
  return unique.map((time) => new Date(time).toISOString())
}
