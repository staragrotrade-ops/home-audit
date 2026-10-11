import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { ADMIN_COOKIE, isAdminConfigured, verifyAdminSessionToken } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  if (!isAdminConfigured()) notFound()
  const store = await cookies()
  if (verifyAdminSessionToken(store.get(ADMIN_COOKIE)?.value)) redirect('/admin')
  const { error } = await searchParams

  return (
    <main id="main-content" className="admin-shell admin-login">
      <section className="admin-login-card">
        <p className="admin-kicker">Home Audit</p>
        <h1>Admin sign in</h1>
        <form action="/api/admin/login" method="post">
          {/* A fixed username lets phone password managers save the password. */}
          <input
            className="admin-hidden-username"
            type="text"
            name="username"
            autoComplete="username"
            defaultValue="admin"
            tabIndex={-1}
            aria-hidden="true"
          />
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <label className="admin-check">
            <input type="checkbox" name="remember" /> Keep me signed in on this device for 90 days
          </label>
          {error === 'locked' && (
            <p className="admin-message error">Too many attempts. Try again in 15 minutes.</p>
          )}
          {error && error !== 'locked' && <p className="admin-message error">Incorrect password.</p>}
          <button className="admin-button primary" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  )
}
