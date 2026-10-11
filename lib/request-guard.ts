// Server-only helpers shared by public and admin API routes.
import { createHash } from 'node:crypto'

// Mutations must come from this site. A missing Origin header is rejected.
export function isSameOriginMutation(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host === new URL(request.url).host ||
      new URL(origin).host === request.headers.get('host')
  } catch {
    return false
  }
}

// Analytics beacons may omit Origin (sendBeacon on some browsers), so only a
// present and foreign Origin is rejected.
export function isAllowedBeaconOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === request.headers.get('host')
  } catch {
    return false
  }
}

export function clientHash(request: Request, purpose: string) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    ''
  const agent = request.headers.get('user-agent') || ''
  return createHash('sha256')
    .update(`home-audit-v1|${purpose}|${ip || agent}`)
    .digest('hex')
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|preview|facebookexternalhit|embedly|python|curl|wget|axios|node-fetch|go-http|java\//i

export function isLikelyBot(request: Request) {
  const agent = request.headers.get('user-agent') || ''
  return agent.length < 10 || BOT_PATTERN.test(agent)
}

export function deviceType(request: Request): '' | 'mobile' | 'tablet' | 'desktop' {
  const agent = request.headers.get('user-agent') || ''
  if (!agent) return ''
  if (/ipad|tablet|(android(?!.*mobile))/i.test(agent)) return 'tablet'
  if (/mobi|iphone|android/i.test(agent)) return 'mobile'
  return 'desktop'
}

export function visitorCountry(request: Request) {
  const value = request.headers.get('x-vercel-ip-country') || ''
  return /^[A-Z]{2}$/.test(value) ? value : ''
}

export async function readJsonBody(request: Request, maxBytes: number) {
  const raw = await request.text()
  if (Buffer.byteLength(raw, 'utf8') > maxBytes) throw new Error('Request is too large.')
  return JSON.parse(raw) as unknown
}
