// Server-only. Verifies a Cloudflare Turnstile token.
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export function turnstileConfigured() {
  return Boolean(process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
}

export async function verifyTurnstile(token: string, request: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret || !token) return false
  const body = new URLSearchParams({ secret, response: token })
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (ip) body.set('remoteip', ip)
  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body })
    const result = (await response.json()) as { success?: boolean; action?: string }
    return result.success === true && (!result.action || result.action === 'quote')
  } catch {
    return false
  }
}
