# Home Audit monthly editorial workflow

## Purpose

Publish one original, evidence-led Home Audit guide each month that answers a
real buyer question, demonstrates inspection expertise and strengthens the
site's topical authority without creating thin or repetitive pages.

The article library lives at `/guides`. Published articles are registered in
`lib/guides.ts`, which feeds the hub, homepage feature and sitemap.

## Monthly cadence

| Timing | Task | Output |
| --- | --- | --- |
| First Monday | Review search performance, current market developments and recent inspection questions | One approved topic and search intent |
| Days 1–5 | Research primary sources and prepare the article | 1,500–2,200 word draft with source notes |
| Days 6–9 | Technical review by Xiaoqiong Yang | Corrected inspection language and practical examples |
| Days 10–12 | Owner approval and implementation | Final copy, metadata, schema and internal links |
| By the 15th | Run the release gate and publish | Live article, sitemap entry and homepage or service-page link |
| 28–35 days later | Review indexing and early query data | Notes for title, intro or internal-link improvement |

Current market claims must be rechecked on publication day. A future article
must not silently reuse statistics from an older draft.

## November 2026 article — prepared brief

**Working title**

Can You Rely on Someone Else's Building Inspection Report?

**Proposed URL**

`/guides/can-you-rely-on-someone-elses-building-inspection-report`

**Primary question**

If a seller, agent, report platform or previous buyer offers an existing
building inspection report, can the new buyer safely and legally rely on it?

**Search intent**

A Victorian buyer has been offered a cheaper copy of an existing report and
wants to understand the difference between receiving a PDF, becoming the
inspector's client and obtaining enforceable rights under the report terms.

**Distinctive angle**

The article will not state that every shared report is invalid or biased. It
will separate questions that are often collapsed into one purchase button:

1. who commissioned the inspection and defined its scope;
2. who the inspector treated as the client;
3. ownership of the document versus permission to rely on its contents;
4. any disclaimer or restriction on third-party reliance;
5. whether the inspector reissues the report and accepts the later buyer;
6. report date, changed conditions and original access limitations;
7. professional indemnity insurance and complaint pathways; and
8. legal advice required before assuming a duty of care exists.

**Proposed structure**

1. Short answer: do not assume that buying a copy makes you the client.
2. Four common report pathways: vendor, agent, prior buyer and report platform.
3. What “reissued in your name” should and should not mean.
4. The difference between technical usefulness and legal reliance.
5. A checklist of questions to put directly to the inspector.
6. When an existing report may still be useful as background information.
7. A privacy-safe suburb-named case supplied or approved by the owner.
8. FAQ, legal limitation and independent inspection call to action.

**Inputs required before drafting**

- Anonymised examples of reports that were offered for on-sale or reissue.
- The standard engagement and third-party reliance wording used by Home Audit.
- A legal review of Victorian contract, negligence and consumer-law wording;
  the article must not invent a general rule about enforceability.
- Confirmation of the case suburb and removal of the street address, client,
  agent, vendor and original report identifiers.
- Current Victorian consumer guidance and any relevant interstate report-sale
  schemes clearly identified as interstate rather than Victorian law.

**SEO package required**

- One H1 and a self-referencing canonical.
- SEO title under approximately 60 characters where practical.
- Meta description focused on the buyer's question.
- `Article`, `BreadcrumbList` and matching visible `FAQPage` data.
- Visible publication date, modified date and reviewer.
- Internal links to the agent-pressure guide, market-cycle guide, pre-purchase
  service, building and pest service, service areas and quote flow.

## Six-month topic roadmap

| Target month | Topic | Strategic role |
| --- | --- | --- |
| November 2026 | Can you rely on someone else's inspection report? | Completes the on-sold-report topic cluster |
| December 2026 | Which defects have negotiating power? | Converts inspection terminology into buyer decisions |
| January 2027 | Pre-auction inspection: what can be done when time is short? | Captures urgent high-intent searches |
| February 2027 | Moisture readings in a building report: what they do and do not prove | Demonstrates technical restraint and expertise |
| March 2027 | Building inspection access limitations: the areas buyers overlook | Differentiates Home Audit reporting quality |
| April 2027 | Renovated homes: where old and new work create hidden risk | Supports established-home and local-area pages |

Topics may change when Search Console data, policy changes or repeated client
questions reveal a stronger opportunity. Avoid publishing several location
pages and a long guide in the same week; give each material page time to be
crawled and internally linked.

## Publication checklist

- Confirm the article answers one primary question in the first 120 words.
- Verify every current statistic against a primary source on publication day.
- Keep dated market context separate from evergreen inspection guidance.
- Use an original Home Audit image with meaningful alt text where available.
- Show the reviewer and registration accurately.
- Do not invent repair prices, negotiation savings, case outcomes or client
  quotes.
- State inspection scope, access limits and the need for specialist or legal
  advice where relevant.
- Add the guide to `lib/guides.ts`, the `/guides` hub, sitemap and release gate.
- Add one contextual link from an established service or location page.
- Run `npm run verify:release` before production deployment.
- After deployment, verify the canonical, indexability, JSON-LD, sitemap and
  production runtime logs.
