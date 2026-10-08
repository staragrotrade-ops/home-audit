import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { pageMetadata } from '@/lib/metadata'
import { SITE_URL } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'New Home & Construction Stage Inspections Melbourne',
  description:
    'Independent slab, frame, pre-plaster, fixing and practical completion inspections for new homes across Melbourne and supported Victorian locations.',
  path: '/new-home-inspections',
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
          name: 'New Home Inspections',
          item: `${SITE_URL}/new-home-inspections`,
        },
      ],
    },
    {
      '@type': 'Service',
      name: 'New Home and Construction Stage Inspections',
      serviceType: 'Independent residential construction stage inspection',
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: [
        { '@type': 'City', name: 'Melbourne' },
        { '@type': 'AdministrativeArea', name: 'Victoria' },
      ],
      url: `${SITE_URL}/new-home-inspections`,
    },
  ],
}

const stages = [
  {
    number: '01',
    title: 'Slab stage',
    text: 'Review visible slab construction and available project information at the nominated inspection point.',
  },
  {
    number: '02',
    title: 'Frame stage',
    text: 'Inspect accessible framing before it is progressively concealed by later work.',
  },
  {
    number: '03',
    title: 'Pre-plaster',
    text: 'Review accessible framing and service penetrations before wall linings are installed.',
  },
  {
    number: '04',
    title: 'Fixing stage',
    text: 'Inspect visible finishes and installed elements as the home approaches completion.',
  },
  {
    number: '05',
    title: 'Practical completion / PCI',
    text: 'Document visible incomplete, defective or damaged work before handover.',
  },
]

export default function NewHomeInspectionsPage() {
  return (
    <main id="main-content">
      <JsonLd data={structuredData} />
      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">New builds</p>
            <h1>Independent new home stage inspections in Melbourne.</h1>
            <p>
              Select one construction stage or build an inspection programme
              from slab through to practical completion.
            </p>
          </div>
          <div className="page-hero-aside">
            <strong>Independent of your builder</strong>
            <span>Stage inspections · PCI · Extensions and renovations</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container content-grid">
          <aside>
            <h2>Before requesting a quote</h2>
            <ul>
              <li>Property address</li>
              <li>Builder and site-contact details</li>
              <li>Current construction stage</li>
              <li>Expected inspection-ready date</li>
              <li>Plans or relevant documents, if available</li>
            </ul>
          </aside>

          <div className="prose">
            <h2>Choose the stage that matches the construction programme</h2>
            <p className="answer-summary">
              Each stage offers a different window into the work. Earlier
              inspections can identify visible issues before components are
              covered, while practical completion focuses on the finished home
              before handover.
            </p>

            <div className="stage-grid">
              {stages.map((stage) => (
                <article className="stage-card" key={stage.number}>
                  <span>{stage.number}</span>
                  <strong>{stage.title}</strong>
                  <p>{stage.text}</p>
                </article>
              ))}
            </div>

            <p>
              <Link className="text-link" href="/guides/pre-slab-inspection-glen-waverley">
                Read a real Glen Waverley pre-slab inspection case study{' '}
                <span aria-hidden="true">→</span>
              </Link>
            </p>

            <p>
              <Link className="text-link" href="/guides/builder-friend-vs-pre-handover-inspector">
                Can a builder friend replace an independent pre-handover
                inspection? <span aria-hidden="true">→</span>
              </Link>
            </p>

            <p>
              Nearing handover? Read the dedicated{' '}
              <Link className="text-link" href="/practical-completion-inspection">
                practical completion inspection guide
              </Link>{' '}
              for PCI timing, scope and limitations.
            </p>

            <h2>A stage inspection is not builder supervision</h2>
            <p>
              The service is an independent inspection at an agreed point in
              time. It does not replace the builder’s quality controls,
              statutory inspections, design consultants or continuous site
              supervision. The report reflects accessible work visible on the
              inspection date.
            </p>

            <aside className="related-guide-card">
              <p className="eyebrow">New-home guide</p>
              <h2>Why builders may discourage independent inspections</h2>
              <p>
                Building surveyors, internal QA staff and bank valuers perform
                different roles. Read the common claims owners hear—and what
                each one leaves unchecked.
              </p>
              <div className="related-guide-links">
                <Link
                  className="text-link"
                  href="/guides/independent-new-home-stage-inspections"
                >
                  Common builder claims about independent stage inspections{' '}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>

            <h2>Pricing follows the stage and project scope</h2>
            <p>
              The amount of work varies with the stage, dwelling size,
              construction complexity, location and available documentation.
              Straightforward jobs can be quoted from the submitted details;
              unusual projects are reviewed manually rather than given a
              misleading automatic price.
            </p>

            <h2>What the report records</h2>
            <p>
              The report records visible conditions at the agreed stage,
              supported by photographs where useful. It also identifies work
              that was concealed, incomplete, obstructed or unsafe to inspect,
              so the limits of the inspection are clear.
            </p>

            <div className="callout">
              <h3>Know when the site will be ready?</h3>
              <p>
                Provide the expected date and builder contact. If timing is not
                final, choose a flexible booking request.
              </p>
              <Link className="button" href="/quote?service=new-home">
                Request a new-home quote
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
