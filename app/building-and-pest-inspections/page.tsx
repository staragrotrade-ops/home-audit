import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { ThermalCaseStudy } from '@/components/case-study'
import { pageMetadata } from '@/lib/metadata'
import { SITE_URL } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Building & Pest Inspections Melbourne',
  description:
    'Independent pre-purchase and pre-auction building and timber-pest inspections across Melbourne and supported Victorian locations.',
  path: '/building-and-pest-inspections',
})

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
      ],
    },
    {
      '@type': 'Service',
      name: 'Building and Pest Inspections',
      serviceType: 'Pre-purchase building and timber-pest inspection',
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: [
        { '@type': 'City', name: 'Melbourne' },
        { '@type': 'AdministrativeArea', name: 'Victoria' },
      ],
      url: `${SITE_URL}/building-and-pest-inspections`,
    },
  ],
}

const scopeItems = [
  ['Building exterior', 'Visible walls, roof exterior where safely accessible, drainage and site conditions.'],
  ['Building interior', 'Visible walls, ceilings, floors, windows, doors and wet areas.'],
  ['Roof space', 'Accessible framing, moisture indicators, insulation and visible defects.'],
  ['Subfloor', 'Accessible supports, ventilation, moisture and timber conditions.'],
  ['Timber-pest risk', 'Visible evidence and conditions conducive to termites and other timber pests.'],
  ['Access limitations', 'Locked, obstructed, unsafe and concealed areas are clearly identified.'],
]

export default function BuildingAndPestPage() {
  return (
    <main id="main-content">
      <JsonLd data={structuredData} />
      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Existing homes</p>
            <h1>Building &amp; pest inspections in Melbourne before you buy or bid.</h1>
            <p>
              An independent, visual assessment of the property’s accessible
              building elements and timber-pest risk—organised to support a
              practical purchasing decision.
            </p>
          </div>
          <div className="page-hero-aside">
            <strong>Melbourne &amp; Victoria</strong>
            <span>Pre-purchase · Pre-auction · Building only · Timber pest</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container content-grid">
          <aside>
            <h2>Common reasons to book</h2>
            <ul>
              <li>Before signing a contract</li>
              <li>Before an auction</li>
              <li>During a due-diligence period</li>
              <li>When visible movement or moisture raises concern</li>
              <li>Before selling an existing home</li>
            </ul>
          </aside>

          <div className="prose">
            <h2>What the inspection is designed to reveal</h2>
            <p className="answer-summary">
              The inspection records significant visible defects, safety
              concerns, moisture indicators and timber-pest evidence or risk
              factors in areas that can be safely accessed. It also records the
              areas that could not be inspected, because those limitations can
              matter just as much as the observations.
            </p>

            <p>
              Buying an established property? The dedicated{' '}
              <Link className="text-link" href="/pre-purchase-building-inspection">
                pre-purchase inspection guide
              </Link>{' '}
              explains timing, access and what happens after the inspection.
            </p>

            <div className="scope-grid">
              {scopeItems.map(([title, text]) => (
                <div className="scope-item" key={title}>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <ThermalCaseStudy />

            <h2>Building and timber-pest scopes work together</h2>
            <p>
              Moisture, poor drainage, subfloor ventilation and concealed timber
              are building conditions that can also increase timber-pest risk.
              Combining the scopes gives a more connected view of the property
              than treating each concern in isolation.
            </p>

            <h2>What the inspection cannot do</h2>
            <p>
              The standard inspection is visual and non-invasive. It does not
              involve cutting openings, moving fixed finishes or guaranteeing
              conditions inside concealed construction. Roofs, roof spaces and
              subfloors are inspected only where access and safety allow.
            </p>

            <h2 id="how-buyers-use-the-report">What the report is for</h2>
            <p>
              The report brings the visible findings, photographs and access
              limitations into one record. It is intended to help the purchaser
              understand the observed condition and decide whether further
              investigation, specialist advice or contract guidance is needed.
            </p>
            <p>Buyers use the report in four main ways:</p>
            <ul className="report-uses">
              <li>
                <strong>Renegotiating the price.</strong> Together with quotes
                from licensed tradespeople, the findings can support a request
                to lower the price. This can cover repair costs or the risk you
                take on.
              </li>
              <li>
                <strong>Ending the contract.</strong> If your contract has a
                building inspection condition, the report can be the evidence
                you rely on. Whether you can end the contract depends on its
                wording, so ask your lawyer or conveyancer.
              </li>
              <li>
                <strong>Checking before settlement.</strong> Take the report to
                your final inspection before settlement. If there is new damage,
                your lawyer or conveyancer can ask the vendor to repair it or
                pay for it.
              </li>
              <li>
                <strong>A record for later.</strong> The report records the
                condition of the home when you bought it. A few years later, you
                can compare it and see whether recorded defects have got worse.
                This helps you decide when to repair or renovate.
              </li>
            </ul>
            <p>
              The report is one part of the decision. Use it together with
              advice from your lawyer or conveyancer and quotes from licensed
              tradespeople.
            </p>
            <p>
              The report records the building evidence. Your contract
              determines how that evidence may be used. Read the{' '}
              <Link className="text-link" href="/guides/major-building-defect-vs-major-structural-defect-victoria">
                Victorian inspection-clause guide
              </Link>
              .
            </p>

            <div className="callout">
              <h3>Have an auction or contract deadline?</h3>
              <p>
                Add the deadline to your quote request. Availability, property
                access and reporting timing can then be considered together.
              </p>
              <Link className="button" href="/quote?service=building-and-pest">
                Request a quote
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
