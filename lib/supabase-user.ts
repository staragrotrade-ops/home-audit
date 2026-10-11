// Server-only. Authenticates the inspector app: the app signs in with
// Supabase Auth and sends its access token as "Authorization: Bearer ...".
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

export type StaffMember = {
  id: string
  email: string
  display_name: string
  role: 'admin' | 'inspector'
  active: boolean
  registration_number: string | null
}

export type AuthenticatedInspector = {
  supabase: SupabaseClient
  user: User
  staff: StaffMember
}

export class AppAuthError extends Error {}

function bearerToken(request: Request) {
  const match = (request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

export async function authenticateInspector(request: Request): Promise<AuthenticatedInspector> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) throw new Error('The app service is not configured.')

  const token = bearerToken(request)
  if (!token) throw new AppAuthError('Sign in again.')

  const supabase = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  // Ask Supabase Auth to verify the token instead of trusting its claims.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  if (error || !user) throw new AppAuthError('Sign in again.')

  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id,email,display_name,role,active,registration_number')
    .eq('auth_user_id', user.id)
    .maybeSingle()
  if (staffError || !staff?.active) throw new AppAuthError('This account is not an active inspector.')

  return { supabase, user, staff: staff as StaffMember }
}

export function appError(error: unknown, fallback: string) {
  const status = error instanceof AppAuthError ? 401 : 400
  const message = error instanceof Error && error.message ? error.message : fallback
  return Response.json({ ok: false, error: message }, { status, headers: { 'Cache-Control': 'no-store' } })
}
