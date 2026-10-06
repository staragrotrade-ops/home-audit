# Home Audit Development Principles and Roadmap

## Purpose

Home Audit is developed as a long-term search, AI-discovery and conversion
platform for existing-home and new-home inspections. The operating principle is
to publish a truthful, technically sound and useful site early, allow search
engines to begin learning the entity, and improve it continuously from real
inspection experience and measured search behaviour.

The site must not wait for every possible service, location or integration to
be complete before launch. It also must not publish invented credentials,
placeholder promises, thin location pages or unsupported claims merely to
increase page count.

## Development principles

1. **Launch a coherent truth, then improve it.** Publish once the domain,
   canonical URLs, core services, professional identity and crawl controls are
   correct. Add depth after launch without changing stable URLs unnecessarily.
2. **No cloaking or hidden SEO text.** Information intended for search engines
   must also be available to people. Lower-profile professional information may
   live on a footer-linked credentials page, but it must remain readable and
   accurate.
3. **Evidence before marketing claims.** Prefer real scope explanations,
   anonymised field examples, original photographs, access limitations and
   practical next steps over generic superlatives.
4. **One page, one primary search intent.** Hub pages explain the service
   family. Dedicated pages answer important intents such as pre-purchase and
   practical completion without duplicating whole sections.
5. **Entity consistency.** Home Audit, GXH Consultancy Pty Ltd, professional
   registration, service descriptions and location coverage must agree across
   the website, structured data, Google Business Profile and external listings.
6. **Stable migration.** NBI remains a protected legacy and referral asset.
   Pages move only after a URL-level review and a genuine Home Audit
   replacement exists.
7. **Useful local coverage only.** Location pages are created only for real
   service areas and must include materially different local experience. No
   mass-produced suburb doorway pages.
8. **Search and AI use the same factual foundation.** Keep important content in
   visible text, allow legitimate search crawlers, use matching structured data
   and do not depend on special AI files or invented schema.
9. **Protect privacy while preserving local context.** Every published case
   must state its suburb, because the locality is useful to buyers, search
   engines and AI systems interpreting the example. Never publish the street
   address, client name, agent or vendor identity, report number, original
   inspection company or other details that could identify the transaction.
   If the suburb plus the remaining facts would still identify a client, do not
   publish the case until the other facts can be safely generalised.
10. **Verify every release.** Tests, TypeScript, production build, important
    routes, metadata, structured data, mobile layout and crawl files must pass
    before a package is described as ready.

## Case-study locality rule

The suburb name is mandatory for every real or composite case published on Home
Audit. Use the suburb in the visible case label and body copy, and include it in
structured data when the case is material to the page. A broad phrase such as
“Melbourne's south-east” is not a substitute for the suburb.

The locality must never be combined with a street number, street name, client
name or a rare set of transaction details. The editorial aim is credible local
context without enabling a reader to identify the property or people involved.

## Delivery sequence

### Stage 0 — Launch foundation

- Connect the production site to `homeaudit.com.au`.
- Redirect `www` permanently to the apex domain.
- Keep preview deployments out of search results.
- Publish a clear homepage, Building & Pest hub, New Home hub, About page and
  low-profile Credentials page.
- Publish the first high-intent pages: Pre-Purchase and Practical Completion.
- Keep the quote route crawlable but `noindex`; exclude it from the sitemap.
- Verify crawler access, canonical URLs, sitemap, robots, HTTPS and 404s.
- Submit the production sitemap to Google Search Console only after DNS is live.

### Stage 1 — First two weeks after launch

- Finalise contact details, quote response route and service-specific terms.
- Publish the first focused local cluster: 12 substantive pages across the
  Mornington Peninsula / Frankston and Casey / Cardinia, linked through one
  service-area hub.
- Add Pre-Auction and Timber Pest pages.
- Add Frame and Pre-Plaster inspection pages.
- Add a Building Inspection Cost page once pricing rules are confirmed.
- Establish the Home Audit Google Business Profile and consistent external
  business descriptions where eligible.

### Stage 2 — Weeks three to eight

- Improve the initial 12 service-area pages from Search Console queries, real
  enquiries and anonymised inspection experience before adding more suburbs.
- Add only four to six new areas at a time (see `CONTINUATION_BACKLOG.md` for
  the expansion gate), selected from business demand and
  NBI Search Console evidence.
- Publish anonymised, photo-led inspection case studies.
- Add concise answers for real customer questions discovered from calls,
  enquiries and Search Console queries.
- Add original field images and captions without publishing full sample reports.

### Stage 3 — Months two to four

- Build legitimate third-party references from conveyancers, buyer advocates,
  agents, industry partners and local publications.
- Publish original aggregated inspection observations when the sample is large
  enough and the method can be explained.
- Review Home Audit and NBI performance page by page before any redirect.
- Consolidate only where Home Audit has become the genuine replacement.

### Stage 4 — Ongoing

- Review Search Console monthly for queries, indexing, CTR and page overlap.
- Track quote starts, completions and referral sources without exposing client
  data.
- Improve existing pages before producing large volumes of new pages.
- Update content dates only after a substantive factual or service change.

## Launch gate

A release may go live when all of the following are true:

- the production build succeeds with no TypeScript errors;
- automated tests pass;
- public routes return successful responses and private routes remain excluded;
- homepage and service pages have unique titles, descriptions, H1s and
  self-referencing canonicals;
- structured data matches visible content;
- only indexable informational pages are present in the sitemap;
- the production domain and `www` redirect are verified;
- no real customer data, secret or private address is present in source or
  rendered pages; and
- live quote submission remains disabled until its database, abuse protection,
  terms and notifications are verified.
