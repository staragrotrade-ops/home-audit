import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { pageMetadata } from '@/lib/metadata'
import { COMPANY_NAME, SITE_URL } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'About Home Audit',
  description:
    'How Home Audit approaches independent building, pest and new home inspections across Melbourne and supported Victorian locations.',
  path: '/about',
  appendSiteName: false,
})

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${SITE_URL}/about#page`,
  name: 'About Home Audit',
  url: `${SITE_URL}/about`,
  about: { '@id': `${SITE_URL}/#organization` },
}

export default function AboutPage() {
  return (
    <main id="main-content">
      <JsonLd data={structuredData} />
      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">About Home Audit</p>
            <h1>Independent inspection, clear limits and practical answers.</h1>
            <p>
              Home Audit helps buyers and new-home owners understand visible
              building conditions before a major property decision.
            </p>
          </div>
          <div className="page-hero-aside">
            <strong>Operated by {COMPANY_NAME}</strong>
            <span>Existing homes · New builds · Melbourne &amp; Victoria</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container content-grid">
          <aside>
            <h2>What guides the service</h2>
            <ul>
              <li>Independence from the seller, agent and builder</li>
              <li>Evidence before assumption</li>
              <li>Plain-English reporting</li>
              <li>Clear access and scope limitations</li>
              <li>Practical next steps</li>
            </ul>
          </aside>

          <div className="prose">
            <h2>Built around the property decision</h2>
            <p>
              Existing-home and construction-stage inspections answer
              different questions. Home Audit keeps those services separate so
              the agreed scope, timing and report reflect the decision the
              customer actually needs to make.
            </p>

            <h2>An evidence-led inspection approach</h2>
            <p>
              Findings are based on conditions that are visible and safely
              accessible at the inspection time. The report distinguishes
              observed defects from areas that were concealed, obstructed or
              unsafe, and identifies when further specialist or invasive
              investigation should be considered.
            </p>

            <h2>Professional oversight without a personality-led brand</h2>
            <p>
              Home Audit is a brand-first inspection service. Inspection work
              is carried out or technically overseen by a Victorian Registered
              Building Inspector (Limited), with professional indemnity
              insurance maintained for the inspection services provided.
            </p>
            <p>
              <Link className="text-link" href="/credentials">
                View registration and insurance details
              </Link>
            </p>

            <div className="callout">
              <h3>Choosing an inspection?</h3>
              <p>
                Start with whether the property is an existing home or a new
                build. The quote path will then ask only for details relevant to
                that inspection.
              </p>
              <Link className="button" href="/quote">
                Start a quote
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
