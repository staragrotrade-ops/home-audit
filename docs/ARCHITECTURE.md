# Home Audit Architecture

## Confirmed platform role

- Brand: Home Audit
- Canonical domain: `https://homeaudit.com.au`
- Core services: Building & Pest, New Home Inspections, Owner Builder 137B gateway
- Geography: Melbourne and operationally supported Victoria, with initial local
  pages focused on Mornington Peninsula / Frankston and Casey / Cardinia
- NBI: legacy/bridge domain whose existing ranking URLs remain protected
- Dedicated 137B domain: remains the detailed eligibility, quote and booking destination

## Stack

- Next.js App Router on Vercel
- Supabase for operational records
- Stripe for payments
- Google Calendar for appointments
- Xero for customer, invoice and payment linkage
- Resend for transactional email

## One-job-record rule

`jobs.id` is the operational identity shared by quoting, payment, scheduling,
admin and the future onsite/reporting app. Provider identifiers are attached to
that record; no integration may create an independent shadow job.

## Phase 1 security model

- Customer forms post to a server route rather than directly to Supabase.
- Supabase secret keys remain server-only.
- All operational tables have RLS enabled.
- `anon` and `authenticated` receive no direct table grants in the foundation.
- Quote creation is an atomic, `security invoker` database function callable
  only by `service_role`.
- Admin sample data contains no real customer information and the route is
  excluded from indexing.
- Quote submission is feature-gated and defaults to off.
- Browser-facing responses include baseline framing, MIME-sniffing, referrer
  and permissions-policy headers.
- Live launch still requires rate limiting or a challenge such as Turnstile.

## Domain and SEO role

Home Audit is the long-term SEO/conversion platform. Location relevance belongs
in service and location pages—not in a longer domain name. NBI pages will be
mapped before any redirect or retirement decision to avoid losing existing
rankings.

The local-search layer uses one `/service-areas` hub and statically generated
detail pages backed by a single typed data source. Each published area must have
materially different local guidance, visible internal links and matching
structured data; no route may imply an office that does not exist.

Professional credentials are published on a footer-linked, low-profile public
page and repeated only in matching structured data. The information must never
be hidden from users or exposed only to crawlers.

## Current integration boundary

The schema reserves provider identifiers for Stripe, Google Calendar and Xero,
but Phase 1 does not create external payments, appointments, invoices or email.
Those integrations must update the existing `jobs.id`; they must not create a
parallel job identity.
