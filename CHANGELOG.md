# Changelog

## 0.6.5 — 2026-10-08

- Added a sixth guide, `/guides/builder-friend-vs-building-inspector`:
  whether a builder friend can replace independent inspections at any build
  stage (pre-slab to handover), covering written records, disputes, method,
  accountability, tracking repairs and the inspection window at each stage, with FAQ and Article / Breadcrumb / FAQ data.
- Changes from the supplied brief: rewritten in plainer language; the
  dispute and handover statements now cite the specific Consumer Affairs
  Victoria and Building and Plumbing Commission pages (checked
  8 October 2026) instead of agency homepages; the SEO title was shortened so
  it fits with the site name; signed by Xiaoqiong Yang like the other guides.
  The article does not name any builder.
- Linked from `/new-home-inspections`; links to the PCI page and the new-home
  stage guide; added to the Guides hub, sitemap (27 URLs), tests and release
  gate.

## 0.6.4 — 2026-10-08

- Added a fifth guide, `/guides/pre-slab-inspection-glen-waverley`: a
  Glen Waverley pre-slab case study (reinforcement too close to a PVC drainage
  pipe), why drawings are not the only applicable rules, what mandatory
  inspections do and do not show, a pre-pour checklist, FAQ, and Article /
  Breadcrumb / FAQ data.
- Changes from the supplied brief:
  - Signed by Xiaoqiong Yang, but the site story and the building-surveying
    account are not hers (owner confirmed), so they are told as "our
    inspector" and as the same unnamed team-member account used in the other
    guides ("more than ten" inspections a day). The brief's request to change
    the other guides to "more than 15" in Xiaoqiong's name was not applied.
  - Rewritten in plainer language, consistent with the owner's earlier edits.
  - The AS 2870 catalogue link is listed without a URL because the page could
    not be opened to confirm it; all other sources were checked on
    8 October 2026.
- Linked from `/new-home-inspections`, the new-home stage guide and the Guides
  hub; added to the sitemap (26 URLs), tests and release gate.

## 0.6.3 — 2026-10-07

Deployed to production on 7 October 2026.

- Reworded the defect-clause guide in plainer language at the owner's request:
  removed slogan-style contrasts, repeated parallel sentences and em-dash
  asides from the hero, summary, section headings, red flags, FAQ and closing
  section. No facts, sources, links or legal qualifications were changed.
- Removed red flag 16 (inaccessible areas described as a pass) at the owner's
  request, along with the FAQ on an inaccessible roof space or subfloor; the
  guide now lists fifteen red flags and six questions.

## 0.6.2 — 2026-10-07

Deployed to production on 7 October 2026.

- Added a fourth guide,
  `/guides/major-building-defect-vs-major-structural-defect-victoria`: the
  standard General Condition 21 wording against a restrictive special
  condition, sixteen contract and property red flags, older-home warning
  signs, a pre-signing checklist, FAQ, and Article / Breadcrumb / FAQ data.
- Authored by Xiaoqiong Yang, described (owner-confirmed) as founder and
  working inspector with 10 years' experience who personally conducts building
  and pest inspections. No separate reviewer line.
- Changes from the supplied brief:
  - The first-person building-surveying account is published as the same
    unnamed third-person account used in the new-home guide ("a member of the
    Home Audit team", "more than ten" inspections a day), per owner decision,
    so the two guides do not contradict each other.
  - The public contract PDF used as the restrictive example is not linked: it
    identifies a property and the parties. Its special-condition details were
    supplied in the brief and were not independently verified.
  - Reddit and Whirlpool threads were dropped because they could not be
    opened; one verified PropertyChat thread is cited as an anecdotal example.
  - The SEO title was changed so it does not end in two brand separators.
- Legal and regulatory statements were checked on 6 October 2026 against the
  LPLC article on Willis v Crosland and six Consumer Affairs Victoria pages.
- Linked from the Guides hub, the agent-pressure guide,
  `/pre-purchase-building-inspection` and `/building-and-pest-inspections`;
  added to the sitemap (25 URLs), tests and release gate.

## 0.6.1 — 2026-10-06

Deployed to production on 6 October 2026.

- Added a third guide, `/guides/independent-new-home-stage-inspections`
  ("What builders may tell you about independent new home stage inspections"):
  thirty common claims in three groups, the four inspection roles, owner
  actions, stage overview, FAQ, and Article / Breadcrumb / FAQ structured data.
- Authored by Xiaoqiong Yang, per owner instruction. The supplied brief's
  first-person account of working inside a building surveying practice was
  rewritten as an unnamed third-person account ("a member of the Home Audit
  team") so it is not attributed to the named author; no other individual is
  named.
- Regulatory statements cite Consumer Affairs Victoria and the BPC Guide to
  Standards and Tolerances 2026, checked on 6 October 2026. The brief's NAB,
  HIA and BPC practice-note links were not used because they could not be
  verified.
- Linked the guide from `/new-home-inspections`, `/practical-completion-inspection`
  and the Guides hub (now addressed to buyers and new-home owners); added it
  to the sitemap (24 URLs), tests and release gate.

## 0.6.0 — 2026-10-06

Adds the buyer-guide section from the separate 0.4.x–0.5.2 line of work on top
of the hardened 0.3.2 release. Numbered 0.6.0 so it supersedes both lines.
Nothing else from 0.5.2 was taken: 0.3.2's contact email, admin gate, quote
flow, API hardening, privacy/terms, CSP and Next.js 16.3.8 are unchanged.

- Added the `/guides` hub and two long-form buyer guides:
  `/guides/agent-pressure-skip-building-inspection` and
  `/guides/building-inspection-buyers-market`, each with Article, Breadcrumb
  and FAQ structured data, sources, and anonymised suburb-level case studies
  (Dromana, Carrum Downs) with two report-excerpt images.
- Added "Guides" to the main navigation, "Buyer guides" to the footer, a
  latest-guide section on the homepage and a related-guides card on the
  Pre-Purchase page.
- Sitemap now lists the hub and both guides (23 URLs); `pageMetadata` supports
  `article` Open Graph data while keeping the Googlebot directives.
- Guide styles were ported onto the renamed palette tokens.
- Adopted the case-study locality rule and `docs/EDITORIAL_CALENDAR.md`.
- Release gate and tests cover the guide routes, sitemap entries and content.

## 0.3.2 — 2026-10-06 (not yet deployed)

Follow-up to the post-launch review. `npm run verify:release` passed locally
on 2026-10-06 (14 tests, TypeScript, build, route checks).

- Privacy notice and website terms reviewed and completed after the first
  0.3.2 deployment (analytics, retention, complaints, overseas disclosure,
  liability, governing law). Not legal advice; redeploy to publish.
- Upgraded Next.js 16.3.3 → 16.3.8 to clear the critical `next/og`
  ImageResponse advisory (GHSA-vcvr-r3jv-pc5j). The site does not use
  `ImageResponse`, but the deployed 0.3.1 still runs 16.3.3 until this ships.
- The release gate now runs on Windows as well as macOS/Linux.

- Published the contact email `info@homeaudit.com.au` in the footer and on the
  quote page. While live submission is off, the final quote step now opens a
  pre-filled email instead of showing a "foundation preview" notice.
- `/admin` now returns 404 unless `ADMIN_PREVIEW_ENABLED=true`; robots.txt
  disallows `/admin` (previously `/admin/`, which did not match the route).
- Replaced the placeholder privacy and terms pages with interim working text.
  These still need review by the owner / a legal adviser.
- Page metadata now repeats the Googlebot preview directives that child pages
  were silently dropping; the About title no longer repeats the brand.
- Quote flow: switching service family clears the other family's selections;
  per-field validation messages (client and server); privacy-consent checkbox;
  success state that prevents duplicate submission; saved drafts expire after
  seven days and can be cleared by the user.
- Quote API: real body-size limit, same-origin check, best-effort per-IP rate
  limit, and service-family normalisation. Turnstile or a shared-store limiter
  is still required before enabling live submission.
- New migration `20261006090000_quote_job_hardening.sql`: existing customers
  can no longer be overwritten via the public form, consent timestamp, allowed
  value constraints, Melbourne-dated references.
- Optional GA4 loader (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) with quote start /
  email hand-off / submit events. Added a Content-Security-Policy header.
- Hero image now keeps the inspector in frame; removed the decorative rule that
  ran through the hero heading. Indicator colours that failed contrast on light
  backgrounds (selected cards, FAQ markers, list markers) now use clay.
- Renamed stale CSS tokens (`--navy`, `--orange`, …) to match the palette and
  removed the unloaded `Inter` font from the stack.
- Release gate: corrected the preview host and added checks for the admin 404,
  About title, Googlebot directives and the published email.

## 0.3.1 — 2026-10-03

- Reworked the full-site palette around a Mornington coastal direction: deep
  eucalyptus, warm clay, sandstone, coastal ivory and pale sage.
- Replaced the former saturated orange and near-black navy styling across
  navigation, calls to action, service pages, forms and local-area pages.
- Updated the browser theme colour and favicon to match the refreshed brand.
- Preserved the existing page structure, content, SEO metadata and quote flow.

## 0.3.0 — 2026-10-03

- Added a crawlable Service Areas hub organised around two operationally
  focused corridors: Mornington Peninsula / Frankston and Casey / Cardinia.
- Added 12 indexable local inspection guides for Mount Eliza, Mornington,
  Mount Martha, Frankston, Langwarrin, Carrum Downs, Berwick, Cranbourne,
  Clyde North, Officer, Pakenham and Narre Warren.
- Gave every local page unique housing context, inspection priorities,
  service-selection guidance, FAQs, metadata and self-referencing canonical.
- Added visible breadcrumbs, nearby-area links and links to the relevant
  existing-home, new-home and practical-completion service pages.
- Added matching Breadcrumb, Service and FAQ structured data without claiming
  a physical office in each suburb.
- Updated the main navigation, homepage and footer to make the area hierarchy
  accessible to users and crawlers.
- Expanded the sitemap and release gate to cover the hub and all 12 area pages,
  including route, indexation, canonical, H1, JSON-LD and true-404 checks.

## 0.2.0 — 2026-10-03

- Adopted a launch-first development principle: publish a coherent truthful
  foundation, then expand from search evidence and real inspection work.
- Rewrote homepage and service-page H1s to identify the inspection service and
  Melbourne location directly.
- Added About and low-profile Credentials pages.
- Added Xiaoqiong Yang, Building Inspector (Limited), registration
  `IN-L 100094`, and professional indemnity insurance disclosure.
- Added Person and professional-credential structured data matching visible
  content.
- Added dedicated Pre-Purchase Building Inspection and Practical Completion
  Inspection pages with direct answers, scope, limitations and FAQs.
- Set the transactional quote route to `noindex` and removed it from the
  sitemap.
- Added a production-content sitemap and noindex response header for Vercel
  preview hosts.
- Added a repeatable release gate for tests, build, routes, indexation,
  canonicals, JSON-LD, credentials, sitemap and 404 behaviour.
- Documented the staged SEO, AI-discovery and NBI migration roadmap.

## 0.1.0 — 2026-09-19

- Confirmed Home Audit and `homeaudit.com.au` as the primary long-term brand/domain.
- Expanded scope from Building & Pest alone to include New Home Inspections.
- Added brand-first responsive homepage and core service pages.
- Added an adaptive quote-flow foundation for existing homes and new builds.
- Added first-touch attribution, including AI-referral capture.
- Added the initial secure Supabase schema centred on one shared job record.
- Added a sample-only admin pipeline shell.
- Added canonical metadata, sitemap, robots policy, structured data and favicon.
- Added social metadata, service/FAQ JSON-LD and an image sitemap entry.
- Added baseline response security headers and stricter quote validation.
- Corrected colour contrast and selection semantics after automated WCAG checks.
- Kept the dedicated 137B website as the detailed 137B booking destination.
