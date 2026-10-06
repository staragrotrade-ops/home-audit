import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { pageMetadata } from '@/lib/metadata'
import {
  SERVICE_AREAS,
  SERVICE_AREA_REGIONS,
  type ServiceAreaRegion,
} from '@/lib/service-areas'
import { SITE_URL } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Building Inspection Service Areas Melbourne',
  description:
    'Explore Home Audit building, pest and new-home inspection service areas across the Mornington Peninsula, Frankston, Casey and Cardinia.',
  path: '/service-areas',
})

const regionIntroductions: Record<ServiceAreaRegion, string> = {
  'Mornington Peninsula & Frankston':
    'A strong fit for pre-purchase and timber-pest inspections across established, renovated and infill housing, with new-home services also available.',
  'Casey & Cardinia':
    'A balanced corridor for established-home due diligence and independent new-build stage or practical completion inspections.',
}

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
      ],
    },
    {
      '@type': 'CollectionPage',
      '@id': `${SITE_URL}/service-areas#page`,
      name: 'Home Audit building inspection service areas',
      url: `${SITE_URL}/service-areas`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: SERVICE_AREAS.length,
        itemListElement: SERVICE_AREAS.map((area, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: `${area.name} building inspections`,
          url: `${SITE_URL}/service-areas/${area.slug}`,
        })),
      },
    },
  ],
}

export default function ServiceAreasPage() {
  return (
    <main id="main-content">
      <JsonLd data={structuredData} />

      <section className="page-hero area-hub-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Local inspection coverage</p>
            <h1>Building inspection service areas across south-east Melbourne.</h1>
            <p>
              Start with the property location, then choose the inspection that
              matches an established purchase, active build or approaching
              handover.
            </p>
          </div>
          <div className="page-hero-aside">
            <strong>{SERVICE_AREAS.length} priority service areas</strong>
            <span>
              Mornington Peninsula · Frankston · Casey · Cardinia
            </span>
          </div>
        </div>
      </section>

      <section className="section area-hub-intro">
        <div className="container split-heading">
          <div>
            <p className="eyebrow">Focused local coverage</p>
            <h2>Useful local guidance, not a list of copied suburb pages.</h2>
          </div>
          <p>
            Every page below explains the housing context, likely access issues
            and inspection priorities for that area. Service remains subject to
            the exact address, safe access and scheduling.
          </p>
        </div>
      </section>

      {SERVICE_AREA_REGIONS.map((region, regionIndex) => {
        const areas = SERVICE_AREAS.filter((area) => area.region === region)

        return (
          <section
            className={`section area-region${regionIndex % 2 === 1 ? ' area-region-tint' : ''}`}
            key={region}
          >
            <div className="container">
              <div className="area-region-heading">
                <div>
                  <p className="eyebrow">Priority cluster {regionIndex + 1}</p>
                  <h2>{region}</h2>
                </div>
                <p>{regionIntroductions[region]}</p>
              </div>

              <div className="area-card-grid">
                {areas.map((area) => (
                  <article className="area-card" key={area.slug}>
                    <div className="area-card-meta">
                      <span>VIC {area.postcode}</span>
                      <span>{area.council}</span>
                    </div>
                    <h3>{area.name}</h3>
                    <p>{area.serviceBalance}</p>
                    <Link href={`/service-areas/${area.slug}`}>
                      View {area.name} inspection guide{' '}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )
      })}

      <section className="section service-area-choice">
        <div className="container content-grid">
          <aside>
            <h2>Choose by property status</h2>
            <ul>
              <li>Buying an established home</li>
              <li>Bidding at auction</li>
              <li>Building at an active stage</li>
              <li>Approaching practical completion</li>
            </ul>
          </aside>
          <div className="prose">
            <h2>Your suburb does not determine the whole scope.</h2>
            <p className="answer-summary">
              The address helps with travel and local context. The property
              type, age, construction stage, access and deadline determine the
              actual inspection and quote.
            </p>
            <p>
              If your suburb is not listed, you can still request a quote.
              Other metropolitan and selected Victorian locations are
              considered according to route, timing and the inspection needed.
            </p>
            <div className="area-service-links">
              <Link href="/building-and-pest-inspections">
                <strong>Buying a completed home</strong>
                <span>Explore building and timber-pest inspections</span>
              </Link>
              <Link href="/new-home-inspections">
                <strong>Building a new home</strong>
                <span>Explore stage and practical completion inspections</span>
              </Link>
            </div>
            <div className="callout">
              <h3>Have a property address?</h3>
              <p>
                Send the suburb, property type and deadline so coverage and the
                right inspection scope can be confirmed.
              </p>
              <Link className="button" href="/quote">
                Request a quote
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

