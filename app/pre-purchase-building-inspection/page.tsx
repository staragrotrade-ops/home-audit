import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { pageMetadata } from '@/lib/metadata'
import { SITE_URL } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Pre-Purchase Building Inspection Melbourne',
  description:
    'Independent pre-purchase building inspections for houses, townhouses and units across Melbourne and supported Victorian locations.',
  path: '/pre-purchase-building-inspection',
})

const faqs = [
  {
    question: 'When should I arrange a pre-purchase inspection?',
    answer:
      'Arrange the inspection early enough for access, inspection and reporting before the decision deadline that applies to your purchase or auction.',
  },
  {
    question: 'Does a building inspection include timber pests?',
    answer:
      'A building inspection and a timber-pest inspection are separate scopes. They can be requested together so visible building conditions and timber-pest risks are considered in one purchasing process.',
  },
  {
    question: 'Can every part of the property be inspected?',
    answer:
      'No. The inspection is visual and non-invasive. Locked, concealed, obstructed, unsafe or inaccessible areas are identified as limitations in the report.',
  },
]

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Building & Pest Inspections',
          item: `${SITE_URL}/building-and-pest-inspections`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Pre-Purchase Building Inspection',
          item: `${SITE_URL}/pre-purchase-building-inspection`,
        },
      ],
    },
    {
      '@type': 'Service',
      name: 'Pre-Purchase Building Inspection',
      serviceType: 'Pre-purchase residential building inspection',
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: [
        { '@type': 'City', name: 'Melbourne' },
        { '@type': 'AdministrativeArea', name: 'Victoria' },
      ],
      url: `${SITE_URL}/pre-purchase-building-inspection`,
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
}

const scopeItems = [
  ['External areas', 'Visible walls, accessible roof exterior, drainage and site conditions.'],
  ['Internal areas', 'Visible floors, walls, ceilings, doors, windows and wet areas.'],
  ['Roof space', 'Accessible framing, moisture indicators, insulation and visible conditions.'],
  ['Subfloor', 'Accessible supports, ventilation, moisture and timber conditions.'],
  ['Safety concerns', 'Visible conditions that may warrant prompt attention or specialist review.'],
  ['Inspection limits', 'Areas that could not be inspected are recorded rather than assumed.'],
]

export default function PrePurchaseInspectionPage() {
  return (
    <main id="main-content">
      <JsonLd data={structuredData} />
      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Existing homes</p>
            <h1>Pre-purchase building inspections in Melbourne.</h1>
            <p>
              An independent visual inspection to help you understand
              significant visible defects, access limitations and areas that
              may need further investigation before you commit.
            </p>
          </div>
          <div className="page-hero-aside">
            <strong>For houses, townhouses and units</strong>
            <span>Contract deadlines · Due diligence · Pre-auction</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container content-grid">
          <aside>
            <h2>Best time to book</h2>
            <ul>
              <li>Before signing an unconditional contract</li>
              <li>Before an auction</li>
              <li>Within an agreed due-diligence period</li>
              <li>Once agent or vendor access is confirmed</li>
              <li>With the decision deadline clearly stated</li>
            </ul>
          </aside>

          <div className="prose">
            <h2>What is a pre-purchase building inspection?</h2>
            <p className="answer-summary">
              It is a visual, non-invasive assessment of safely accessible
              parts of an existing property before purchase. The report records
              observed defects and conditions, explains access limitations and
              identifies where specialist or invasive investigation should be
              considered.
            </p>

            <h2>What is inspected</h2>
            <div className="scope-grid">
              {scopeItems.map(([title, text]) => (
                <div className="scope-item" key={title}>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <h2>Building and timber-pest scopes are different</h2>
            <p>
              A building inspection considers visible building condition. A
              timber-pest inspection considers visible evidence of termites and
              other timber pests, together with conditions that may increase
              risk. A combined request can give a more connected view of
              moisture, drainage, ventilation and concealed-timber risk.
            </p>

            <h2>Access limitations form part of the result</h2>
            <p>
              The inspection does not involve cutting openings, shifting fixed
              finishes or entering unsafe areas. Furniture, stored belongings,
              locked doors, low clearances and unsafe roof conditions may limit
              what can be inspected. Those limitations are documented so the
              purchaser can decide whether additional access or investigation
              is needed.
            </p>

            <h2>After the inspection</h2>
            <p>
              The inspection is completed independently without onsite client
              accompaniment. Findings are then organised into a photo-based
              report, and questions can be discussed after the inspection so
              the property decision remains separate from the site process.
            </p>
            <p>
              Already reviewing a contract? Learn why{' '}
              <Link className="text-link" href="/guides/major-building-defect-vs-major-structural-defect-victoria">
                major building defect and major structural defect are not
                wording to skim
              </Link>
              .
            </p>

            <aside className="related-guide-card">
              <p className="eyebrow">Buyer protection guides</p>
              <h2>Keep the inspection decision separate from the pressure to win.</h2>
              <p>
                Learn how to respond when an agent says the vendor refuses an
                inspection, another buyer is unconditional or an existing
                report should be enough. Then see when documented findings
                carry the most negotiating weight.
              </p>
              <div className="related-guide-links">
                <Link
                  className="text-link"
                  href="/guides/agent-pressure-skip-building-inspection"
                >
                  Read the agent-pressure guide <span aria-hidden="true">→</span>
                </Link>
                <Link
                  className="text-link"
                  href="/guides/building-inspection-buyers-market"
                >
                  Read the buyer&apos;s-market guide <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>

            <div className="faq-list content-faqs">
              {faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>

            <div className="callout">
              <h3>Have a contract or auction deadline?</h3>
              <p>
                Include the deadline and property address in the quote request
                so access, availability and reporting timing can be considered
                together.
              </p>
              <Link className="button" href="/quote?service=building-and-pest">
                Request a pre-purchase quote
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
