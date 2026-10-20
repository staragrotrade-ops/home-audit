# Changelog

## 0.16.0 — 2026-10-21

Groundwork for the Home Audit Inspector app (building & pest).

- Migration `20261021100000_inspection_capture.sql` (apply before deploying):
  floorplans per job, defects pinned on a floorplan with root-cause links,
  trade routing and quantities, defect photos, description templates ranked
  by use, and the `trade_job_leads` view (defects grouped per job and trade,
  for future repair quotes). Private buckets `job-floorplans` and
  `inspection-photos`.
- Field inspectors and issuers are separate: only admins and staff marked
  "Allow issuing reports" (Admin → Inspectors) can register a report.
  Others submit fieldwork, which sets the report to "in review".
- Floorplans: after payment the website tries once to copy the floorplan
  from the listing link (no retries, no bypassing site protection; the
  outcome is shown on the job). Customers can upload a floorplan on their
  order page after paying; admin can upload, remove or retry the listing
  under "Floorplan for the inspector app".
- New app API endpoints for catalog, inspection sync, photos, onsite
  floorplans and fieldwork submission (`docs/APP_API.md`, API version 2).

## 0.15.5 — 2026-10-20

- Visitor statistics: a visit that arrives with a Google Ads click id
  (gclid, gbraid or wbraid) is recorded with source `google_ads` and medium
  `cpc`, so ad visits show separately from ordinary Google search in
  Admin → Visitors. Earlier visits keep their old label.

## 0.15.4 — 2026-10-20

- "Checking before settlement" now says "If the condition is inconsistent
  with the report" instead of "If there is new damage" (the report may not
  photograph everything), and the lawyer or conveyancer raises it with the
  vendor.
- "Ending the contract" links to the major building defect vs major
  structural defect guide.

## 0.15.3 — 2026-10-20

- Building & Pest page, "What the report is for": four ways buyers use the
  report (renegotiating the price with trade quotes; relying on a building
  inspection condition, subject to the contract and legal advice; checking
  the home before settlement; a record to compare years later), and a note
  that the report is used together with legal advice and trade quotes
  (Inspection Agreement 7.4).
- Pre-purchase page, "After the inspection": a short version linking to it.

## 0.15.2 — 2026-10-20

- The thermal camera case study also appears on the pre-purchase building
  inspection page, after "What is inspected".

## 0.15.1 — 2026-10-20

- Real inspection example on the Building & Pest page (after the scope
  list) and on the home page (after "What a useful inspection does"): a
  ground-floor ceiling that looked normal showed a cold spot on a thermal
  camera, about 1.4 °C cooler, and a moisture meter confirmed water from the
  floor above. The buyer used the finding to renegotiate the price (owner
  confirmed). Each card links to the quote form.
- New home inspections page (after the stage cards): Hebel walls missing
  the waterproof coating at the base, shown next to a wall done correctly
  with the pink base coating; hard to see once rendered.
- New home inspections page: warped studs found at frame stage (a level
  showing gaps, and a warped stud). Plasterboard on warped studs can be
  uneven or wavy and is almost impossible to fix later; the builder fixed
  it within a week of the report.
- Photos: Home Audit watermark; the thermal camera's brand and model are
  blurred (other photos are not). The thermal photo has the on-screen labels in English.
- The card says the inspector may use thermal imaging as an extra check
  where conditions allow and it is necessary (owner wording), consistent
  with clause 5.1(w) of the Inspection Agreement.

## 0.15.0 — 2026-10-19

- Inspection Agreement. Customers tick "I have read and agree" on the order
  page before paying; the button reads "Agree and pay". Payment and the
  booking details form are refused without it. Jobs paid another way show
  the agreement first.
- The agreement follows AS 4349.1-2007 (building) and AS 4349.3-2010
  (timber pest), and covers new home stage and handover inspections. It has
  sections on scope, what is not included, access, the report, fees,
  cancellation ($100 if cancelled 3+ business days ahead; no refund after
  that), limitation of liability (the fee, as far as the law allows; the
  Australian Consumer Law is not affected), complaints and general terms.
- The accepted version, time and a SHA-256 fingerprint of the text are saved
  on the job (migration `20261019100000_inspection_agreement.sql`), with an
  audit event and the version in the Stripe metadata. Admin shows the
  status on each job.
- Reviewed against the owner's copy of AS 4349.1-2007: purpose (2.2),
  subjective appraisal (Foreword), acceptance criteria (2.3.6), client
  arranges entry (2.3.2), reasonable access sizes and no removing
  fastenings (Table 3.2), 30 m site features (3.2.1), extent of reporting
  (2.3.5, 4.1), no cost estimates (2.3.1), weather and recent-use defects
  (C4.2), conditions on information and concealment (4.2.7), strata limits
  and common-property costs (Appendix B), and the Appendix D exclusions.
- The report is the inspector's opinion and is advice only: not a full list
  of problems, may differ from the actual condition, and must not be the
  only basis to buy, negotiate the price or value the property; the
  client's decision and risk appetite are their own. Specialist
  recommendations should be followed before buying. Contract-of-sale
  inspection conditions are for the client's lawyer to check. Copyright in
  the report stays with us; a copy may go to the client's lawyer,
  conveyancer or lender.
- The report is provided as a digital copy (email or download). The
  inspector is not named in the agreement (registration details on
  request). The "tell us before repairs" clause is removed.
- Visual and non-invasive: any access that needs a tool to open (screwed or
  fixed panels, hatches, covers, sealed openings, locks) is treated as not
  accessible, in the scope, the exclusions and the key points.
- Customers must read the full written report; spoken comments on site or
  by phone are not guaranteed to be complete or accurate. Up to 15 minutes
  of phone time per inspection; time beyond that is charged at a rate
  given before the call goes past 15 minutes.
- Written in formal contract style (owner decision): defined terms (the
  Client, the Company, the Inspection, the Report, the Fee, Business Day,
  ACL), 12 numbered clauses, plus severance, no-waiver and jurisdiction
  clauses. The plain-English summary above the tick box stays, so the
  terms remain transparent under the Australian Consumer Law.
- New page /inspection-agreement (noindex), linked from the footer, the
  terms page, the quote email and the payment email. Terms and privacy
  notice updated (19 October 2026).

## 0.14.1 — 2026-10-19

- The customer's order page no longer shows "Referred by …" (owner
  decision). Referral tracking, the statement and commission in Admin are
  unchanged. The privacy policy no longer says the order page shows the
  partner's name.

## 0.14.0 — 2026-10-18

- Google Ads (account 551-924-7556): the Google tag `AW-18520017169` loads on
  the production site only (not on preview or local builds, and not on order,
  booking or admin pages). It shares one gtag.js with GA4 when a measurement
  ID is set.
- Conversion `BP_Quote_Submitted` (label `vEi7CLqj96AdEJGShP9E`) is sent once
  when an existing-home quote is accepted by the server with a reference. The
  quote reference is the transaction id, so a repeat cannot double count.
  New-home quotes, the email handoff and honeypot responses are not reported.
  An instant quote waits up to one second for Google before opening the
  order page.
- Ad attribution is now captured on the first public page of a visit, not
  only on /quote. Visitors who land on a service or suburb page from an ad
  and then open the quote keep their gclid and UTM tags. gbraid and wbraid
  are stored in `google_click_id` with a `gbraid:` / `wbraid:` prefix. A new
  ad click replaces an older saved source; a saved source expires after 90
  days.
- `/quote?service=building-and-pest` opens at the property step with
  Existing home and Building & pest already selected. A quote start is
  counted at the first answer for these visits.
- Content Security Policy allows the Google Ads hosts
  (googleadservices.com, googleads.g.doubleclick.net, td.doubleclick.net).
- Privacy page: new "Google Ads" section; the statement that no advertising
  cookies are used is removed.

## 0.13.1 — 2026-10-18

- Phone number changed to 03 7047 8366 everywhere it appears (header,
  footer, quote and order pages, booking pages, email sign-off and the
  Organization structured data).

## 0.13.0 — 2026-10-16

- New cluster 3, City of Kingston: six suburb pages in the same format as
  Casey & Cardinia: Cheltenham, Mentone, Mordialloc, Chelsea, Parkdale and
  Highett. Each page has its own housing context, four priorities and three
  FAQs, in short plain sentences (about 11 words per sentence). Each new page
  is at least 71.7% different from every other area page (5-word shingles of
  the visible text); the first 12 pages are at least 73.2% different.
- Cheltenham and Highett show both councils (Kingston and Bayside).
  Mordialloc and Chelsea explain that flood overlays are checked through the
  Council, not by the inspection.
- /service-areas: "Priority service areas" instead of a fixed count; Kingston
  added to the hero and description. Home page text and featured links
  include Kingston suburbs. Carrum Downs and Frankston list Chelsea as nearby.
- Phone number changed to 0472 570 359 everywhere it appears (header,
  footer, quote and order pages, booking pages, email sign-off and the
  Organization structured data).
- Calendar events are now 1.5 hours long (owner decision 15 October).
  Existing events change when "Update calendar" is pressed or the job is
  saved again.

## 0.12.0 — 2026-10-15

- Booked jobs go into Google Calendar, like the 137B site: same "NBI job"
  calendar by default, event "HA – SUBURB" (2 hours) with job, client,
  payment, access and agent details and a dashboard link.
- The event is created or moved whenever a booked time is saved (by the
  owner or by the agent's confirmation), updated when agent or access details
  change, and removed when the time is cleared or the job is cancelled. Test
  jobs are skipped. A calendar problem is shown on the job and never stops a
  booking.
- Job card: calendar status with "Add to calendar" / "Update calendar".
  Connections: Connect Google Calendar.
- Needs Supabase migration `20261016100000_calendar_sync.sql` and the Google
  OAuth settings in docs/BACKEND_SETUP.md section 15.

## 0.11.2 — 2026-10-15

- The owner's "Price review needed" email is now also sent when a request is
  saved but its automatic price could not be saved (before, that request
  arrived with no email).

## 0.11.1 — 2026-10-15

- Approving a referral partner who registered online emails them their link
  and QR code (the registration page says it will).
- "Email link" button for each referrer with an email address, so the owner
  can send the link to anyone added in the dashboard. Adding a referrer does
  not email them by itself.
- The type "Real estate agent (selling)" is now "Real estate agent".

## 0.11.0 — 2026-10-14

- Referral partners, as on ownerbuilderinspection.melbourne: conveyancers,
  solicitors, buyer's agents, mortgage brokers, selling agents, past
  customers and others. Each gets a short code, a link (?ref=CODE) and a QR
  code.
- The referral code is kept in the visitor's browser for 90 days (the last
  link wins) and saved on the quote request. The owner can change "Referred
  by" on any job.
- Commission per referrer: fixed $ per paid job or % of the fee excluding GST.
- Admin → Referrers: approve or disable partners, change commission, and a
  monthly statement (visits, quotes, paid jobs, success rate, fees,
  commission) with CSV download. Visits from referral links are marked.
- Low-key self-registration at /partners/register (footer link only,
  noindex, Turnstile, rate limited); new registrations wait for approval
  and email the owner.
- The customer's order page shows who referred them; privacy policy updated.
- Needs Supabase migration `20261015100000_referrers.sql`.

## 0.10.1 — 2026-10-13

- "Text times" is now "Generate text": the dashboard only prepares the text.
  It shows the text once (no second copy of the link), its length, an "Open
  in messages app" button and "Copy text". The request list says "Text
  generated for", not "Texted"; the same for "Generate text to agent" and
  "Generate review text".
- Texts no longer contain "&": some phones cut the message at "&" when it
  comes through an sms: link (it showed "Building" and stopped). "&", curly
  quotes, dashes and special spaces are replaced with plain characters in
  every text.
- Shorter booking text and a shorter link (24 characters instead of 43):
  about 230 characters, two standard texts that arrive as one message.

## 0.10.0 — 2026-10-14

- New "Arrange a time" step in each paid job. Offer up to three times to the
  agent (or the customer's access contact) by email or text. The message has
  a private link; when they press a time, it is saved to the job, the
  customer is emailed the date (not the time) and the owner is emailed. They
  can also say none suit and leave a note.
- The agent sees the buyer's name in the email, the text and the booking
  page (and in the existing "Text agent" message). The buyer's contact
  details and situation are not shown.
- An agreed time can still be entered by hand in the same step. Saving it
  closes any request still waiting for a reply.
- The booked time is no longer edited in the job editor, so it cannot be
  overwritten by saving notes or status.
- Fixed: the inline Google Analytics and Vercel Analytics setup scripts had
  broken regular expressions (lost backslashes), so GA never started and
  private links were not stripped before reaching Vercel Analytics.
- Booking links are kept out of search engines and analytics.
- Needs Supabase migration `20261014100000_booking_requests.sql`.

## 0.9.2 — 2026-10-13

- The phone number 03 7047 8366 is now shown on the site: in the header
  (tap to call on mobile), the footer, the quote page, the order pages and
  the sign-off of customer emails. It is also added to the Organization
  structured data.

## 0.9.1 — 2026-10-13

- Google redirect links (google.com/goto, google.com/url and similar) are no
  longer accepted as the listing link in the quote form: the customer is
  asked to copy the link from realestate.com.au or domain.com.au, or leave
  it blank. The agent lookup ignores them too, and the dashboard flags an
  existing one.

## 0.9.0 — 2026-10-13

- Admin: "Find agent automatically" asks Google AI (Gemini with Google Search)
  for the selling agent's name, agency, mobile, email, the price guide and
  listing link, fills the form and lists the sources. Nothing is saved until
  the owner checks it and presses Save. Needs `GEMINI_API_KEY`.
- Xero: when a job is paid online, a paid invoice is created in Xero
  (contact found by email or created; reference = job reference; payment to
  the Stripe clearing account) and Xero emails it to the customer. Each step
  is recorded, so retries never add a second invoice or payment. Test orders
  are skipped. Admin shows the Xero status per paid job with "Send to Xero",
  and a Connections section with "Connect Xero". Own Xero app and encrypted
  token storage (migration `20261013100000_xero_invoices.sql`).

## 0.8.2 — 2026-10-13

- Admin: "Ask Google AI for agent" opens Google's AI Mode with the property
  address, asking for the selling agent's name, agency, mobile, email and
  the price guide. Replaces "Copy AI listing check".

## 0.8.1 — 2026-10-12

- The customer is emailed straight after asking for a quote: the price and
  payment link for an instant quote, or a "request received" note with their
  order link when the price needs a review. Previously no email went out
  until payment, so a closed page lost the link.
- Owner notifications are also sent for test orders, marked "[Test]" in the
  subject, so the emails can be checked end to end.

## 0.8.0 — 2026-10-12

Instant quotes, online payment and the booking workflow.

- **Pricing** (`lib/pricing.ts`): $500 + GST ($550) for building & pest,
  building-only and pre-auction inspections when the listing price guide is
  up to $1.5m, the drive from Mount Eliza is 90 minutes or less (Google
  Routes) and the preferred date / deadline is at least 3 Victorian business
  days away. Everything else, and all new homes, goes to a price review.
- **Quote form**: asks for the price guide and the listing link; an instant
  price opens the customer's order page.
- **Order page** (`/order/<private link>`): price, Stripe Checkout payment,
  then the buyer's situation (5 options) and who to contact for access.
  Payment is confirmed on return from Stripe and by the webhook; only a
  "paid" Home Audit session marks a job paid, and the database checks the
  amount.
- **Admin**: price review with "send quote", listing and agent details,
  "Text agent" (opens the phone's messages app, the buyer's situation is never
  included), "Email customer the date" (date only, no time), Google review
  request by email or text, and a fresh customer link.
- **Emails** (Resend, optional): new request and paid alerts to the owner;
  quote, payment received, booking date and review request to the customer.
- Shared Stripe account: sessions carry `site_key=home_audit`, so the 137B
  webhook ignores them and this site ignores 137B's.
- Migration `20261012100000_instant_quotes_and_booking.sql`.
- Online quote form requires a Cloudflare Turnstile check (free); without
  Turnstile keys it stays on the email handoff.
- Payment safeguards: only one open Stripe payment page per job; the private
  order link is never sent to Stripe (customers return through
  `/order/return`); a second payment or a wrong amount is not applied and the
  owner is emailed to refund or check it; an instant price lapses if the date
  gets closer than 3 business days before payment.
- Second review fixes: a payment row is created before the Stripe page, with
  one pending payment per job, so double clicks or a closed tab cannot charge
  twice; an already-paid page is detected before a new one opens; the owner's
  new price closes any page still open at the old price and is never reset
  by the 3-day rule; only the browser that paid is taken back to the private
  order page; Google Analytics never sees order links; the booked date is
  emailed automatically when saved; the owner is told when an instant price
  lapses into review.

## 0.7.0 — 2026-10-11

Backend for the admin dashboard, first-party visitor statistics and the
future inspector app, modelled on the 137B site but without the 137B scope
and pricing logic.

- **Admin** (`/admin`): shared password with an HMAC-signed cookie (12 hours,
  or 90 days on a trusted device), login rate limit, noindex. Stays 404 until
  `ADMIN_DASHBOARD_PASSWORD` and `ADMIN_SESSION_SECRET` are set.
  - Visitors: visits, page views, time on site, quote starts and requests,
    phone/email taps, daily chart, sources (Google, ChatGPT, Facebook…),
    top pages, devices, countries, recent visits with the pages viewed.
  - Quotes & jobs: open / closed / archived lists, search, customer and
    property details, status, inspector assignment, booking time, internal
    notes, archive and test flags, issued reports, and the pages a customer
    viewed before asking.
  - Inspectors: create app logins, reset passwords, disable.
  - "Stop counting this device" for the owner's own browsers.
- **Visitor statistics**: `VisitorTracker` sends page views and active time
  (visible and focused) to `/api/analytics/*`. No cookie, no IP address;
  bots, previews and the owner's devices are skipped.
- **Quote form**: while online submission stays off, the email-app handoff
  also saves a copy of the request for the dashboard. The memory-only rate
  limit is backed by a shared database limit.
- **Inspector app API** (`/api/app/*`, see `docs/APP_API.md`): Supabase Auth
  bearer tokens, assigned-jobs feed, progress updates, private PDF report
  upload with SHA-256 and versioning.
- **Database**: migration `20261011120000_admin_analytics_and_app.sql`
  (analytics tables and summary function, staff, assignments, RLS, report
  storage). Tested against PostgreSQL 16 with Supabase-style roles.
- Review fixes before release: the email-handoff copy needs a same-site
  Origin and is never written from previews; a site-wide hourly cap on quote
  copies; rate-limit hashes are keyed with a server secret and kept for at
  most two hours; report registration accepts only the exact upload path and
  checks the stored size; logout needs a same-site Origin.
- Privacy notice updated for the statistics and the saved form copy.
- Setup steps: `docs/BACKEND_SETUP.md`.

## 0.6.7 — 2026-10-09

- Turned on Vercel Web Analytics (page views, visitors, referrers, countries,
  devices; no cookies). The script is served from this origin and is added to
  production builds only. No new npm dependency. Google Analytics remains off
  unless a measurement ID is configured.

## 0.6.6 — 2026-10-08

- The builder-friend guide is now signed "By Home Audit Inspector" (linking to
  `/about`), with Home Audit as the Article author in structured data. Other
  guides keep the Xiaoqiong Yang byline.

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
