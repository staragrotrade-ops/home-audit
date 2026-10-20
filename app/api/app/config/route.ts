export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Public sign-in settings for the inspector app. Both values are public client
// credentials (the publishable key is already sent to every browser); the
// secret key is never returned.
export function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !publishableKey || publishableKey.startsWith('sb_secret')) {
    return Response.json({ ok: false, error: 'The app service is not configured.' }, { status: 503 })
  }
  return Response.json(
    { ok: true, apiVersion: 2, supabaseUrl, publishableKey },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  )
}
