# Launch Checklist

## Ready now

- Brand, canonical domain and service hierarchy
- Responsive homepage and service pages
- Existing-home and new-home quote journeys (interface only: submission is
  handed to email until the live-submission items below are complete)
- Public contact email `info@homeaudit.com.au`
- SEO metadata, structured data, sitemap and robots policy
- About, professional credentials and insurance disclosure
- Pre-Purchase and Practical Completion search-intent pages
- Service Areas hub and 12 local guides with unique visible content
- Preview-host noindex protection and quote-page noindex
- Secure one-job-record Supabase migration
- First-touch and AI-referral attribution model
- Automated release gate covering tests, build, routing, indexation, canonicals,
  JSON-LD, public credentials, sitemap and true 404 behaviour

## Required before live quote submissions

- Create or select the Home Audit Supabase project and apply both migrations
  in order.
- Add Vercel environment variables using `.env.example` as the key list.
- Add Cloudflare Turnstile and/or a shared-store rate limit to `/api/quote`.
  The built-in per-instance limiter is best-effort only.
- Confirm final inspection scopes, pricing rules and service-area rules.
- Have the interim privacy and terms text reviewed and finalised.
- Confirm `info@homeaudit.com.au` is a working, monitored mailbox.
- Confirm the customer notification and internal notification email wording.
- Test a quote from browser to database using non-production sample data.
- Set `QUOTE_SUBMISSION_ENABLED=true` only after the checks above pass.

## Required before pointing the domain

- Run `npm run verify:release` and retain a passing result.
- Deploy a preview and visually check desktop and mobile before promoting it.
- Attach `homeaudit.com.au` and `www.homeaudit.com.au` to the production Vercel project.
- Copy the exact Vercel DNS records into GoDaddy; do not guess them.
- Confirm the apex is canonical and `www` returns a permanent redirect.
- Verify Search Console, submit `https://homeaudit.com.au/sitemap.xml`, and test structured data.
- Confirm all public pages return 200, HTTPS works, and `/admin` remains noindex.
- Confirm the public credentials page displays Xiaoqiong Yang, registration
  `IN-L 100094`, and the professional indemnity insurance statement accurately.

## Later integrations

- Stripe checkout and webhook reconciliation
- Google Calendar appointment creation/rescheduling
- Xero contact and invoice sync
- Resend transactional email
- Authenticated operations dashboard and onsite/reporting application
