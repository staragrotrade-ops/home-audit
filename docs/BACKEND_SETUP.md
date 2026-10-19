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
- The online quote form only opens once Cloudflare Turnstile is set up
  (step 9). Until then it keeps using the email handoff.

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

1. resend.com → Domains → add `homeaudit.com.au`. The free plan allows one
   domain per team, so if 137B's domain is already in your Resend team,
   create a second team (free) for Home Audit and add the domain there.
2. GoDaddy → homeaudit.com.au → DNS: add the records Resend shows (they sit
   on a `send` sub-domain and `resend._domainkey`, so existing email at
   info@homeaudit.com.au is not affected). Wait for "Verified".
3. Resend → API Keys → create one with sending access.
4. Vercel: `RESEND_API_KEY`, `EMAIL_FROM` = `Home Audit <bookings@homeaudit.com.au>`.

## 8. Google review link

Google Business Profile → "Ask for reviews" → copy the link → Vercel
`GOOGLE_REVIEW_URL`.

## 9. Bot check (Cloudflare Turnstile, free)

1. dash.cloudflare.com (a free account is enough; the domain can stay at
   GoDaddy) → Turnstile → Add widget → hostname `homeaudit.com.au`, mode
   "Managed".
2. Vercel: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (site key) and
   `TURNSTILE_SECRET_KEY` (secret key).

## 10. Switch on

Vercel: `QUOTE_SUBMISSION_ENABLED` = `true`, then redeploy. Test with your own
details from a browser marked "Stop counting this device" (the job is marked
as a test), pay, then refund the test payment in Stripe.

# Agent lookup and Xero (0.9.0)

## 11. Automatic agent lookup (Google AI)

1. aistudio.google.com → Get API key → create the key in the Google Cloud
   project that already has billing (the one used for the Routes API).
   Searching the web from the API is a paid-tier feature; the cost per
   lookup is a few cents at most.
2. Vercel (Production, Sensitive): `GEMINI_API_KEY`. Optional
   `GEMINI_MODEL` (default `gemini-3.8-flash`).

## 12. Xero

1. Supabase SQL Editor → run `20261013100000_xero_invoices.sql` once.
2. developer.xero.com → My Apps → New app ("Home Audit website", Web app,
   company URL https://homeaudit.com.au, redirect URI
   `https://homeaudit.com.au/api/admin/xero/callback`) → copy the Client ID,
   generate a Client secret. Use a separate app from 137B: each app keeps
   its own Xero sign-in, so the two sites cannot sign each other out.
3. Vercel (Production):
   - `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET` (Sensitive)
   - `XERO_REDIRECT_URI` = `https://homeaudit.com.au/api/admin/xero/callback`
   - `XERO_SALES_ACCOUNT_CODE`, `XERO_PAYMENT_ACCOUNT_CODE`: the same values
     as in the 137B Vercel project
   - `XERO_TENANT_ID`: the same value as 137B, if 137B has it
   - `INTEGRATION_ENCRYPTION_KEY` (Sensitive): run in PowerShell
     `[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))`
   - Optional: `XERO_BRANDING_THEME_ID` for a Home Audit invoice layout,
     `XERO_EMAIL_INVOICES=false` to stop Xero emailing the invoice.
4. Redeploy, then /admin → Connections → Connect Xero → sign in and choose
   the National Building Inspections organisation.
5. For a job paid before Xero was connected: open the job → "Send to Xero".

## 13. Arranging a time with the agent (0.10.0)

1. Supabase SQL Editor → run `20261014100000_booking_requests.sql` once,
   before this version goes live. Running it twice is harmless.
2. No new Vercel variables.

In a paid job, "3. Arrange a time":

- Enter up to three times and press "Email times" or "Text times" (or "Just
  make a link" to send it some other way). Send to the agent, or to the
  customer's access contact if they named one.
- The agent opens the link and presses the time that suits, or says none of
  them work and leaves a note. Opening the link alone changes nothing.
- A confirmed time is saved to the job straight away, the customer is
  emailed the date (not the time), and you get an email.
- If you agree a time by phone, enter it under "Already agreed? Booked for"
  and press "Save booked time". This closes any request still waiting, so a
  late click on an old link cannot change the booking.
- Links stop working after 21 days, once answered, or when cancelled.

## 14. Referral partners (0.11.0)

1. Supabase SQL Editor → run `20261015100000_referrers.sql` once, before this
   version goes live. Running it twice is harmless.
2. No new Vercel variables. The registration form uses the same Turnstile
   keys as the quote form.

How it works:

- Each referrer has a short code and a link `https://homeaudit.com.au/?ref=CODE`
  (Admin → Referrers → Copy link / QR code).
- The link saves the code in the visitor's browser for 90 days; a newer link
  replaces it. A quote request records the code on the job.
- Referrers can register at `/partners/register` (small link in the footer,
  not in the menu or sitemap). They start as "Waiting for approval"; their
  link already counts. Approve, disable or set commission in Admin.
  Approving an online registration emails them their link; "Email link"
  sends it to anyone else. Adding a referrer in Admin sends nothing.
- Commission per referrer: a fixed amount per paid job, or a percentage of the
  fee excluding GST.
- On a job, "Referred by" can be changed: from the referral link, a referrer
  you choose (phoned-in referrals), or not referred.
- Monthly statement (Admin → Referrers): link visits, quotes, paid jobs,
  success rate, fees and commission per referrer; jobs count in the
  Melbourne month they were paid; test jobs are left out. CSV download.
- The customer's order page does not name the referrer (owner decision,
  19 October 2026). The privacy policy explains referral links and fees.

## 15. Google Calendar (0.12.0)

Booked jobs go into Google Calendar, like the 137B site.

1. Supabase SQL Editor → run `20261016100000_calendar_sync.sql` once.
2. Google Cloud → the project that holds the 137B site's OAuth client →
   APIs & Services → Credentials → open that OAuth 2.0 Client → Authorised
   redirect URIs → add `https://homeaudit.com.au/api/admin/google/callback`
   → Save. (Reusing the 137B client keeps its "In production" status, so the
   connection does not expire after 7 days.)
3. Vercel (Production):
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Sensitive): the same values
     as in the 137B Vercel project
   - `GOOGLE_REDIRECT_URI` = `https://homeaudit.com.au/api/admin/google/callback`
   - Optional `GOOGLE_CALENDAR_ID`: leave unset to use the same "NBI job"
     calendar as 137B.
4. Redeploy, then /admin → Connections → Connect Google Calendar → sign in
   with the Google account that owns that calendar.
5. For jobs booked before this: open the job → "Add to calendar".

What happens: saving a booked time (by hand, or when the agent confirms)
creates or moves the event; clearing the time or cancelling the job removes
it; changing the agent or the customer's access details updates it. Test
jobs are left out. Events are named "HA – SUBURB", 1.5 hours long, with the
job, client, access and agent details and a link to the dashboard.

## 16. Inspection Agreement (0.15.0)

Customers accept the Inspection Agreement (AS 4349.1-2007, AS 4349.3-2010,
scope, exclusions, cancellation and limitation of liability) before paying.

1. Supabase SQL Editor → run `20261019100000_inspection_agreement.sql` once,
   BEFORE this release is merged. Until it runs, nobody can pay online.
2. Nothing to set in Vercel.

How it works:

- The order page shows the main points, the full agreement and a tick box.
  "Agree and pay" saves the acceptance, then opens Stripe. Payment is refused
  without it.
- A job paid another way (or before 0.15.0) shows the agreement first. The
  booking details form appears once it is accepted.
- The job stores the version, the time and a SHA-256 fingerprint of the exact
  text. An `agreement_accepted` audit event is written. Stripe gets
  `agreement_version` in the payment metadata. Admin shows "Agreement" on
  each job.
- The agreement is also at /inspection-agreement (noindex, linked from the
  footer, the terms page and the payment email).
- Text is in `lib/inspection-agreement.ts`. Any wording change needs a new
  `AGREEMENT_VERSION` (the date) and its fingerprint; the test prints it.
  Jobs keep the version they accepted.
- Cancellation (owner decision 19 October 2026): 3+ business days before the
  inspection, refund less $100 including GST (also when no date is booked);
  under 3 business days or no access on arrival, no refund. Refunds are made
  by hand in Stripe.
