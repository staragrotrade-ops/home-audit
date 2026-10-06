import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { pageMetadata } from '@/lib/metadata'
import {
  SERVICE_AREAS,
  getNearbyServiceAreas,
  getServiceArea,
} from '@/lib/service-areas'
import { SITE_URL } from '@/lib/site'

type ServiceAreaPageProps = {
  params: Promise<{ slug: string }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return SERVICE_AREAS.map((area) => ({ slug: area.slug }))
}

export async function generateMetadata({
  params,
}: ServiceAreaPageProps): Promise<Metadata> {
  const { slug } = await params
  const area = getServiceArea(slug)

  if (!area) return {}

  return pageMetadata({
    title: area.metaTitle,
    description: area.metaDescription,
    path: `/service-areas/${area.slug}`,
  })
}

export default async function ServiceAreaPage({ params }: ServiceAreaPageProps) {
  const { slug } = await params
  const area = getServiceArea(slug)

  if (!area) notFound()

  const nearbyAreas = getNearbyServiceAreas(area)
  const pageUrl = `${SITE_URL}/service-areas/${area.slug}`
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
            name: 'Service Areas',
            item: `${SITE_URL}/service-areas`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: area.name,
            item: pageUrl,
          },
        ],
      },
      {
        '@type': 'Service',
        '@id': `${pageUrl}#service`,
        name: `Building and new-home inspections in ${area.name}`,
        serviceType: [
          'Pre-purchase building inspection',
          'Timber-pest inspection',
          'New-home construction stage inspection',
          'Practical completion inspection',
        ],
        provider: { '@id': `${SITE_URL}/#organization` },
        areaServed: {
          '@type': 'Place',
          name: `${area.name} VIC ${area.postcode}`,
          address: {
            '@type': 'PostalAddress',
            addressLocality: area.name,
            addressRegion: 'VIC',
            postalCode: area.postcode,
            addressCountry: 'AU',
          },
        },
        url: pageUrl,
        description: area.metaDescription,
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: area.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  }

  return (
    <main id="main-content">
      <JsonLd data={structuredData} />

      <section className="page-hero location-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/service-areas">Service areas</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{area.name}</span>
          </nav>
          <div className="page-hero-grid">
            <div>
              <p className="eyebrow">
                Building inspector · {area.name} VIC {area.postcode}
              </p>
              <h1>Building, pest and new-home inspections in {area.name}.</h1>
              <p>{area.hero}</p>
            </div>
            <div className="page-hero-aside location-facts">
              <div>
                <span>Primary fit</span>
                <strong>{area.serviceBalance}</strong>
              </div>
              <div>
                <span>Service area</span>
                <strong>
                  {area.name} VIC {area.postcode}
                </strong>
              </div>
              <div>
                <span>Local council</span>
                <strong>{area.council}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section location-content">
        <div className="container content-grid">
          <aside>
            <h2>Inspection pathways</h2>
            <ul className="aside-link-list">
              <li>
                <Link href="/pre-purchase-building-inspection">
                  Pre-purchase inspection
                </Link>
              </li>
              <li>
                <Link href="/building-and-pest-inspections">
                  Building &amp; timber pest
                </Link>
              </li>
              <li>
                <Link href="/new-home-inspections">New-home stages</Link>
              </li>
              <li>
                <Link href="/practical-completion-inspection">
                  Practical completion / PCI
                </Link>
              </li>
            </ul>
            <p className="aside-note">
              Service is by appointment and depends on the exact address,
              access, construction stage and timing.
            </p>
          </aside>

          <div className="prose">
            <h2>Which inspection is most useful in {area.name}?</h2>
            <p className="answer-summary">{area.summary}</p>

            <h2>Local property context</h2>
            {area.localContext.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}

            <h2>What we pay particular attention to</h2>
            <div className="scope-grid location-priority-grid">
              {area.priorities.map((priority) => (
                <div className="scope-item" key={priority.title}>
                  <strong>{priority.title}</strong>
                  <span>{priority.text}</span>
                </div>
              ))}
            </div>

            <h2>Choose the service by property stage</h2>
            <div className="area-service-links location-service-links">
              <Link href="/building-and-pest-inspections">
                <strong>Buying an existing or completed home</strong>
                <span>{area.existingHomeFit}</span>
                <em>Building &amp; pest inspection →</em>
              </Link>
              <Link href="/new-home-inspections">
                <strong>Building under a construction contract</strong>
                <span>{area.newHomeFit}</span>
                <em>New-home inspections →</em>
              </Link>
            </div>

            <h2>What the report does—and does not—say</h2>
            <p>
              Home Audit records significant visible defects, relevant
              moisture or timber-pest indicators, photographs and access
              limitations at the inspection time. The standard inspection is
              visual and non-invasive: it does not expose concealed work,
              guarantee future performance or replace engineering, plumbing,
              electrical, legal or permit advice when those specialists are
              needed.
            </p>

            <section className="content-faqs" aria-labelledby="local-faq-title">
              <h2 id="local-faq-title">Questions about inspections in {area.name}</h2>
              <div className="faq-list">
                {area.faqs.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <section className="nearby-areas" aria-labelledby="nearby-title">
              <h2 id="nearby-title">Nearby service areas</h2>
              <div className="area-chip-list">
                {nearbyAreas.map((nearbyArea) => (
                  <Link
                    href={`/service-areas/${nearbyArea.slug}`}
                    key={nearbyArea.slug}
                  >
                    {nearbyArea.name} <span aria-hidden="true">→</span>
                  </Link>
                ))}
                <Link href="/service-areas">
                  All service areas <span aria-hidden="true">→</span>
                </Link>
              </div>
            </section>

            <div className="callout location-callout">
              <h3>Request an inspection in {area.name}</h3>
              <p>
                Include the full address, property type, inspection needed and
                any auction, contract or builder deadline. Coverage and
                availability are confirmed before booking.
              </p>
              <Link className="button" href="/quote">
                Request a {area.name} quote
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
