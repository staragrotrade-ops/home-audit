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

# Instant quotes and payment (0.8.0)

Do this after the steps above work.

## 4. Database

SQL Editor → run `20261012100000_instant_quotes_and_booking.sql` once.

## 5. Stripe (shared with 137B)

1. Stripe Dashboard (live mode) → Developers → API keys: use the same secret
   key as 137B, or better, create a restricted key for Home Audit.
2. Developers → Webhooks → Add endpoint
   `https://homeaudit.com.au/api/stripe/webhook`, events
   `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
   Copy its signing secret.
3. Vercel (Production): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
   Customers will see the Stripe account's business name on the payment page
   and card statement, with "HOME AUDIT" added where the card network allows.

## 6. Google driving time

1. Google Cloud → the project used for 137B (or a new one) → enable
   **Routes API** → Credentials → create an API key restricted to Routes API.
   The first 10,000 route lookups each month are free.
2. Vercel: `GOOGLE_MAPS_API_KEY`, and `TRAVEL_BASE_ADDRESS` if the start point
   is not "Mount Eliza VIC 3930, Australia".
   Without the key every quote goes to a price review.

## 7. Email (Resend, GoDaddy DNS)

1. resend.com → Domains → add `homeaudit.com.au`.
2. GoDaddy → homeaudit.com.au → DNS: add the records Resend shows (they sit
   on a `send` sub-domain and `resend._domainkey`, so existing email at
   info@homeaudit.com.au is not affected). Wait for "Verified".
3. Resend → API Keys → create one with sending access.
4. Vercel: `RESEND_API_KEY`, `EMAIL_FROM` = `Home Audit <bookings@homeaudit.com.au>`.

## 8. Google review link

Google Business Profile → "Ask for reviews" → copy the link → Vercel
`GOOGLE_REVIEW_URL`.

## 9. Switch on

Vercel: `QUOTE_SUBMISSION_ENABLED` = `true`, then redeploy. Test with your own
details from a browser marked "Stop counting this device" (the job is marked
as a test), pay, then refund the test payment in Stripe.
