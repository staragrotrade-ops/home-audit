// Server-only. One-way driving time from the base (Mount Eliza) through the
// Google Routes API. Returns null when it cannot be worked out, which sends
// the quote to a manual review instead of guessing.
const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'
export const DEFAULT_BASE_ADDRESS = 'Mount Eliza VIC 3930, Australia'

export async function driveMinutesFromBase(destination: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim()
  if (!apiKey || destination.trim().length < 5) return null

  try {
    const response = await fetch(ROUTES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
      },
      body: JSON.stringify({
        origin: { address: process.env.TRAVEL_BASE_ADDRESS?.trim() || DEFAULT_BASE_ADDRESS },
        destination: { address: destination },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_UNAWARE',
        languageCode: 'en-AU',
        regionCode: 'au',
        units: 'METRIC',
      }),
      signal: AbortSignal.timeout(6000),
    })
    if (!response.ok) {
      console.error('travel_lookup_failed', { status: response.status })
      return null
    }
    const payload = (await response.json()) as {
      routes?: { duration?: string; distanceMeters?: number }[]
    }
    const route = payload.routes?.[0]
    const seconds = Number(String(route?.duration || '').replace(/s$/, ''))
    if (!Number.isFinite(seconds) || seconds <= 0) return null
    return {
      minutes: Math.ceil(seconds / 60),
      distanceMeters: Math.round(Number(route?.distanceMeters) || 0),
    }
  } catch (error) {
    console.error('travel_lookup_failed', { message: error instanceof Error ? error.message : 'unknown' })
    return null
  }
}

export function destinationAddress(address: string, suburb: string, postcode: string) {
  const street = address.trim()
  const extras = [suburb.trim(), postcode.trim()].filter(
    (part) => part && !street.toLowerCase().includes(part.toLowerCase()),
  )
  return `${street}${extras.length ? `, ${extras.join(' ')}` : ''}, VIC, Australia`
}
