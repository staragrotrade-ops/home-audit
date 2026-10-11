# Backend setup (admin, visitor statistics, inspector app)

Everything below fits within the free plans of Supabase and Vercel Hobby.

## 1. Create the Supabase project

1. supabase.com → New project. Name `home-audit`, region **Sydney
   (ap-southeast-2)**, a strong database password (keep it in a password
   manager).
2. SQL Editor → run the files in `supabase/migrations/` **in filename order**
   (each file once):
   - `20260919115508_home_audit_foundation.sql`
   - `20261006090000_quote_job_hardening.sql`
   - `20261011120000_admin_analytics_and_app.sql`
3. Project Settings → API Keys: copy the **Project URL**, the **publishable**
   key and the **secret** key.

## 2. Vercel environment variables (Production)

Vercel → home-audit → Settings → Environment Variables:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable key |
| `SUPABASE_SECRET_KEY` | secret key (never share it) |
| `ADMIN_DASHBOARD_PASSWORD` | your admin password, 10+ characters |
| `ADMIN_SESSION_SECRET` | 32+ random characters |

Then Deployments → latest → Redeploy.

Never paste these values into chat or commit them to GitHub.

## 3. First sign-in

1. Open `https://homeaudit.com.au/admin` and sign in.
2. Press **Stop counting this device** on each phone/computer you use, so your
   own visits are not counted.
3. Inspectors → add a login for each inspector (needed later for the app).

## Notes

- `QUOTE_SUBMISSION_ENABLED` stays `false` for now: the quote form keeps
  opening the customer's email app, and a copy of the request is saved to the
  admin dashboard.
- Supabase pauses a free project after 7 days without any requests. Normal
  website traffic keeps it active.
- Visitor statistics and quote copies are only recorded on the production
  site, not on preview deployments.
- To sign out every device at once (for example after losing a phone),
  change `ADMIN_SESSION_SECRET` in Vercel and redeploy. This also resets the
  "Stop counting this device" setting, so press it again afterwards.
- Before switching on `QUOTE_SUBMISSION_ENABLED`, add a bot check such as
  Cloudflare Turnstile to the quote form.
