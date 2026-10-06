# Verification Record

## Release 0.6.3 — 2026-10-07

- Deployed to production by the owner
  (`home-audit-fcchkkffz-staragrotrade-3957.vercel.app`).
- `npm run verify:release` passed for this exact source in GitHub Actions on
  7 October 2026 (run 37540571252), after it was imported into the repository.
- Checked on `homeaudit.com.au`: the defect-clause guide shows the reworded
  deck and summary, fifteen red flags ending at the owners corporation item,
  and six FAQ questions; the Guides hub shows the new excerpt.

## Release 0.6.2 — 2026-10-07

- Deployed to production by the owner
  (`home-audit-ne2nx7w26-staragrotrade-3957.vercel.app`). The release-gate
  result for this release was not reported back, so it is not recorded here as
  a confirmed pass.
- Checked on `homeaudit.com.au` after deployment: the defect-clause guide loads
  with sixteen red flags, the byline reads Xiaoqiong Yang with no reviewer
  line, no other individual is named, nine sources are listed with no link to
  the example contract or to Reddit, the Guides hub lists four guides, the
  sitemap lists five guide URLs, and `/building-and-pest-inspections` links to
  the guide.
- Not independently verified: the special-condition details of the example
  contract (wording, seven-day period, "sold as inspected" clause), which were
  supplied in the content brief.

## Release 0.6.1 — 2026-10-06

- Deployed to production by the owner after running the release gate; the
  gate result for this release was not reported back, so it is not recorded
  here as a confirmed pass.
- Checked on `homeaudit.com.au` after deployment: the new guide loads with its
  thirty numbered claims, the byline reads Xiaoqiong Yang, no other individual
  is named, the four cited sources are listed, the Guides hub lists three
  guides, and `/new-home-inspections` links to the guide.

## Release 0.6.0 — 2026-10-06

- `npm run verify:release`: `RELEASE PASS` reported by the owner on Windows
  (18 tests in the suite, TypeScript, production build, route checks including
  the three guide routes).
- Deployed to production and checked on `homeaudit.com.au`: `/guides` and both
  guide articles load with their case studies and images, navigation and
  footer links are present, the sitemap lists the three guide URLs and still
  excludes `/quote` and `/admin`, and the footer contact email remains.
- Not independently re-checked: the dated market figures and external links
  inside the guides, which were carried over as written.

## Release 0.3.2 — 2026-10-06

Verified locally on Windows with Node and Next.js 16.3.8; not yet deployed.

- `npm run verify:release`: `RELEASE PASS`
- Unit and SEO tests: 14 passed
- TypeScript check: passed
- Next.js production build: passed, 30 routes
- Route checks: indexable pages, canonicals, JSON-LD, sitemap, robots, true
  404s, `/admin` returns 404, About title, Googlebot directives, contact email

Still to check by hand in a browser after deployment: the quote flow end to
end (including the email hand-off), the hero image crop on desktop and mobile,
the console for Content-Security-Policy violations, and colour contrast
(WCAG A/AA has not been re-run since 0.1.0).

## Release 0.3.1 — 2026-10-03

- Unit and SEO tests: 11 passed
- TypeScript check: passed
- Next.js production build: passed
- 20 indexable routes, including the Service Areas hub and 12 local pages: HTTP
  200, exactly one H1, self-canonical and `index, follow`
- JSON-LD: every launch page contains parseable structured data
- Preview-host protection: `X-Robots-Tag: noindex, nofollow` passed
- Production-host indexation: no accidental `X-Robots-Tag` passed
- Quote route: available and `noindex, follow`
- Credentials: inspector name, `IN-L 100094` and the professional indemnity insurance statement passed
- Sitemap: launch pages included and quote route excluded
- Sitemap: exactly 12 service-area detail URLs present
- AI crawler policy: `OAI-SearchBot` rule present
- Unknown route: true HTTP 404 passed

Run the complete release gate with:

```bash
npm run verify:release
```

The previous 0.1.0 visual baseline passed responsive browser checks at 1440px
and 390px, mobile navigation, quote preselection, overflow, console and WCAG
A/AA checks. Release 0.3.1 also passed the complete release gate, was deployed
to production, and was visually checked on the canonical domain. The new
eucalyptus, clay, sandstone, coastal-ivory and pale-sage palette is live.

Production verification:

- Vercel deployment `dpl_FZ9B1bN1epUFJqFQwiBm8ShcjLos`: `READY`
- `homeaudit.com.au`: live with v0.3.1 palette
- `www.homeaudit.com.au`: redirects to the canonical apex
- production `sitemap.xml`: HTTP 200 with 20 indexable URLs
- Vercel runtime errors in the first post-release hour: none

External integrations and live database submission remain intentionally
disabled until their production credentials and policies are selected.
