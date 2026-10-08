# Home Audit — Launch Foundation

Home Audit is the new SEO, quote and booking platform for:

- Building & Pest inspections for existing homes
- New Home / construction stage inspections
- Owner Builder 137B navigation to the dedicated 137B service

Primary domain: `homeaudit.com.au`

## Current release

Version `0.3.1` combines the first focused local-search layer with the
Mornington coastal visual refresh:

- brand and responsive marketing site
- separate existing-home and new-home service routes
- adaptive quote-flow shell with local draft persistence
- first-touch attribution capture
- one-job-record Supabase schema and atomic quote creation function
- sample-only admin pipeline shell
- canonical metadata, social metadata, service/FAQ structured data and image sitemap
- public About and low-profile Credentials pages
- first dedicated search-intent pages for Pre-Purchase and Practical Completion
- a Service Areas hub and 12 substantive local inspection guides across the
  Mornington Peninsula, Frankston, Casey and Cardinia
- local breadcrumbs, nearby-area links, unique metadata and matching Service /
  FAQ structured data
- preview-host noindex protection and a content-only production sitemap
- responsive and WCAG A/AA browser checks were last run on the 0.1.0 baseline;
  they have not been repeated since the 0.3.1 palette change
- baseline security headers
- a deep-eucalyptus, clay, sandstone, coastal-ivory and pale-sage palette
  applied without changing routes, content, SEO metadata or quote behaviour

Live quote submission is intentionally disabled until the Supabase target,
pricing rules and service-specific terms are confirmed. Until then the quote
form hands the request to the visitor's email app, addressed to
`info@homeaudit.com.au`.

## Local setup

1. Install Node 24.
2. Copy `.env.example` to `.env.local` and provide the required values.
3. Install with `npm ci`.
4. Run `npm run dev`.

Never commit `.env.local` or production secrets.

## Verification

```bash
npm run verify:release
```

This runs the tests, TypeScript check, production build and the route / SEO
checks. `npm run lint` is a TypeScript check only; no ESLint is configured.

With a local server running, `npm run smoke` checks the public routes. Set
`SMOKE_BASE_URL` to test a preview or production deployment.

## Deployment

Source lives in the private GitHub repository `staragrotrade-ops/home-audit`,
which is connected to the Vercel project `home-audit`.

1. Changes are pushed to a branch and opened as a pull request.
2. GitHub Actions runs `npm run verify:release` (`.github/workflows/verify.yml`)
   and Vercel builds a preview deployment for the branch.
3. The owner reviews the preview and merges the pull request.
4. Merging to `main` deploys to production at `homeaudit.com.au`.

Do not deploy with `vercel deploy --prod` from a local folder any more: it
would publish code that is not in the repository.

## Database setup

The initial migration is in
`supabase/migrations/20260919115508_home_audit_foundation.sql`.

Use a dedicated Home Audit Supabase project unless a deliberate shared-project
decision is made. Apply both migrations in order (the second,
`20261006090000_quote_job_hardening.sql`, hardens quote intake), configure the publishable and secret
keys, add abuse protection, and only then set `QUOTE_SUBMISSION_ENABLED=true`.

See `docs/LAUNCH_CHECKLIST.md` before accepting live customer data.

The long-term launch-first content and SEO sequence is documented in
`docs/DEVELOPMENT_PRINCIPLES_AND_ROADMAP.md`.
