import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { pageMetadata } from '@/lib/metadata'
import { SITE_URL } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Practical Completion Inspection Melbourne | PCI',
  description:
    'Independent practical completion and pre-handover inspections for new homes across Melbourne and supported Victorian locations.',
  path: '/practical-completion-inspection',
})

const faqs = [
  {
    question: 'What is a practical completion inspection?',
    answer:
      'A practical completion inspection is an independent visual review of accessible, completed work near handover. It records visible incomplete, defective or damaged items present on the inspection date.',
  },
  {
    question: 'When should the PCI be booked?',
    answer:
      'Book once the builder confirms the home is complete enough, safe and accessible for inspection, allowing time for the report before the relevant handover or contractual decision.',
  },
  {
    question: 'Does a PCI replace statutory inspections?',
    answer:
      'No. It does not replace the building surveyor, mandatory inspections, design consultants, builder quality controls or legal advice about the building contract.',
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
          name: 'New Home Inspections',
          item: `${SITE_URL}/new-home-inspections`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Practical Completion Inspection',
          item: `${SITE_URL}/practical-completion-inspection`,
        },
      ],
    },
    {
      '@type': 'Service',
      name: 'Practical Completion Inspection',
      alternateName: 'PCI and pre-handover inspection',
      serviceType: 'Independent new home practical completion inspection',
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: [
        { '@type': 'City', name: 'Melbourne' },
        { '@type': 'AdministrativeArea', name: 'Victoria' },
      ],
      url: `${SITE_URL}/practical-completion-inspection`,
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

const reviewItems = [
  ['Internal finishes', 'Visible walls, ceilings, floors, joinery, doors and installed finishes.'],
  ['Wet areas', 'Visible fixtures, finishes, sealant, drainage falls and accessible components.'],
  ['External work', 'Visible cladding, openings, finishes, drainage and accessible external elements.'],
  ['Incomplete work', 'Items visibly missing, unfinished or not ready at the inspection time.'],
  ['Damage and workmanship', 'Visible damage or workmanship concerns requiring builder review.'],
  ['Access limitations', 'Areas not complete, obstructed, locked or unsafe are clearly recorded.'],
]

export default function PracticalCompletionInspectionPage() {
  return (
    <main id="main-content">
      <JsonLd data={structuredData} />
      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">New homes</p>
            <h1>Practical completion inspections in Melbourne.</h1>
            <p>
              An independent PCI or pre-handover inspection that documents
              visible incomplete, defective or damaged work before the relevant
              handover decision.
            </p>
          </div>
          <div className="page-hero-aside">
            <strong>Practical completion / PCI</strong>
            <span>Independent of the builder · Photo-based findings</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container content-grid">
          <aside>
            <h2>Have these details ready</h2>
            <ul>
              <li>Property address</li>
              <li>Builder and site-contact details</li>
              <li>Confirmed inspection-ready date</li>
              <li>Relevant plans or schedules, if available</li>
              <li>Handover or contractual deadline</li>
            </ul>
          </aside>

          <div className="prose">
            <h2>What is a practical completion inspection?</h2>
            <p className="answer-summary">
              A PCI is an independent visual inspection of safely accessible
              work when a new home is nearing handover. It records visible
              incomplete, defective or damaged items present on the inspection
              date so they can be raised with the builder through the applicable
              contract process.
            </p>

            <h2>What the inspection reviews</h2>
            <div className="scope-grid">
              {reviewItems.map(([title, text]) => (
                <div className="scope-item" key={title}>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <h2>Timing matters</h2>
            <p>
              The home should be sufficiently complete, safe and accessible for
              a meaningful inspection. If trades are still working, services
              are not ready or rooms are locked, those conditions can limit the
              inspection. Confirm the inspection opportunity and any contractual
              timing with the builder before booking.
            </p>

            <h2>Independent inspection does not replace statutory roles</h2>
            <p>
              A PCI is a point-in-time visual inspection. It does not replace
              mandatory inspections, the building surveyor, design consultants,
              continuous supervision, the builder’s quality controls or legal
              advice about practical completion under the building contract.
            </p>
            <p>
              A PCI also cannot show work that was covered at earlier stages.
              See{' '}
              <Link
                className="text-link"
                href="/guides/independent-new-home-stage-inspections"
              >
                why independent inspections before handover can matter
              </Link>
              .
            </p>

            <h2>The report</h2>
            <p>
              Findings are organised so the owner can distinguish visible
              incomplete work, damage, workmanship concerns and inspection
              limitations. The report records the observed condition; the
              builder remains responsible for assessing and completing the
              work required under the contract and applicable obligations.
            </p>

            <div className="faq-list content-faqs">
              {faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>

            <div className="callout">
              <h3>Know the inspection-ready date?</h3>
              <p>
                Include the expected date, builder contact and deadline so the
                project can be reviewed and scheduled appropriately.
              </p>
              <Link className="button" href="/quote?service=new-home">
                Request a PCI quote
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
