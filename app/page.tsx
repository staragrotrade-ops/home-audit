import Image from 'next/image'
import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { FEATURED_GUIDE } from '@/lib/guides'
import { SERVICE_AREAS } from '@/lib/service-areas'
import { SITE_URL } from '@/lib/site'

const trustPoints = [
  'Registered Building Inspector (Limited)',
  'Independent advice',
  'Clear photo-based reports',
  'Melbourne & Mornington Peninsula',
]

const process = [
  {
    number: '01',
    title: 'Tell us about the property',
    text: 'Choose the inspection and provide only the details that affect scope, timing or price.',
  },
  {
    number: '02',
    title: 'Confirm access and timing',
    text: 'We coordinate the inspection around the auction, contract or construction programme.',
  },
  {
    number: '03',
    title: 'We inspect independently',
    text: 'The inspection is completed without influence from the selling agent or builder.',
  },
  {
    number: '04',
    title: 'Receive a practical report',
    text: 'Findings are organised so you can understand the risks and decide what to do next.',
  },
]

const faqs = [
  {
    question: 'Is a building inspection invasive?',
    answer:
      'No. The standard service is visual and non-invasive. Concealed, locked or unsafe areas may not be inspected, and limitations are recorded in the report.',
  },
  {
    question: 'Can you inspect before an auction?',
    answer:
      'Yes, subject to access and availability. Include the auction date when requesting a quote so urgency can be considered.',
  },
  {
    question: 'Which new-build stages can be inspected?',
    answer:
      'Common stages include slab, frame, pre-plaster, fixing and practical completion. You can request one stage or several.',
  },
]

const featuredAreaSlugs = new Set([
  'mount-eliza',
  'mornington',
  'frankston',
  'berwick',
  'clyde-north',
  'pakenham',
])

const featuredAreas = SERVICE_AREAS.filter((area) =>
  featuredAreaSlugs.has(area.slug),
)

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${SITE_URL}/#faq`,
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
}

export default function HomePage() {
  return (
    <main id="main-content">
      <JsonLd data={structuredData} />
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Independent inspections · Victoria</p>
            <h1>Independent building, pest &amp; new home inspections in Melbourne.</h1>
            <p className="hero-lead">
              Know the home before you commit. We inspect existing properties
              before purchase and new homes at key construction stages.
            </p>
            <div className="button-row">
              <Link className="button" href="/quote">
                Get a quote
              </Link>
              <Link className="text-link" href="#inspections">
                Explore inspections <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className="hero-note">
              Independent visual inspections with clear scope, access limits
              and practical reporting.
            </p>
          </div>

          <div className="hero-image-wrap">
            <Image
              src="/home-audit-inspector-melbourne.webp"
              alt="Building inspector reviewing a Melbourne home"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 54vw"
              className="hero-image"
            />
            <div className="image-caption">
              <strong>Independent assessment</strong>
              <span>Existing homes · New builds</span>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="Service credentials">
        <div className="container trust-list">
          {trustPoints.map((point) => (
            <div key={point}>
              <span aria-hidden="true">✓</span>
              {point}
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="inspections">
        <div className="container">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Choose the right inspection</p>
              <h2>Existing home or new build—we inspect the risk in front of you.</h2>
            </div>
            <p>
              A pre-purchase inspection and a construction-stage inspection
              answer different questions. Each service has its own scope and
              quote path.
            </p>
          </div>

          <div className="service-grid">
            <article className="service-card service-card-featured">
              <div className="service-index">01</div>
              <p className="card-kicker">Buying an existing home</p>
              <h3>Building &amp; Pest Inspections</h3>
              <p>
                Understand visible building defects, moisture concerns,
                timber-pest risk and access limitations before you buy or bid.
              </p>
              <ul>
                <li>Pre-purchase and pre-auction</li>
                <li>Building and timber-pest options</li>
                <li>Clear scope and access notes</li>
              </ul>
              <Link href="/building-and-pest-inspections">
                View existing-home inspections <span aria-hidden="true">→</span>
              </Link>
            </article>

            <article className="service-card">
              <div className="service-index">02</div>
              <p className="card-kicker">Building a new home</p>
              <h3>New Home Inspections</h3>
              <p>
                Independent checks at selected construction stages, from slab
                and frame through to practical completion.
              </p>
              <ul>
                <li>Slab and frame stages</li>
                <li>Pre-plaster and fixing stages</li>
                <li>Practical completion / PCI</li>
              </ul>
              <Link href="/new-home-inspections">
                View new-home inspections <span aria-hidden="true">→</span>
              </Link>
            </article>

            <article className="service-card service-card-dark">
              <div className="service-index">03</div>
              <p className="card-kicker">Selling after owner-builder work</p>
              <h3>Owner Builder 137B</h3>
              <p>
                Use our dedicated 137B service to check whether a report is
                required and obtain an instant quote.
              </p>
              <ul>
                <li>Registered Building Inspector</li>
                <li>Purpose-built eligibility guide</li>
                <li>Online quote and booking</li>
              </ul>
              <a href="https://ownerbuilderinspection.melbourne">
                Open the 137B service <span aria-hidden="true">↗</span>
              </a>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-dark" id="how-it-works">
        <div className="container">
          <div className="section-heading section-heading-light">
            <p className="eyebrow">How it works</p>
            <h2>A straightforward path from property details to a clear report.</h2>
          </div>
          <div className="process-grid">
            {process.map((item) => (
              <article className="process-card" key={item.number}>
                <span>{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section insight-section">
        <div className="container insight-grid">
          <div>
            <p className="eyebrow">What a useful inspection does</p>
            <h2>It separates what is visible now from what still needs investigation.</h2>
          </div>
          <div className="insight-copy">
            <p>
              A visual inspection cannot expose every concealed condition. A
              useful report identifies observed defects, explains access and
              inspection limitations, and points out when specialist or
              invasive investigation should be considered.
            </p>
            <div className="mini-grid">
              <div>
                <strong>Observed</strong>
                <span>Visible defects and conditions at inspection time</span>
              </div>
              <div>
                <strong>Limited</strong>
                <span>Areas affected by access, finishes or stored items</span>
              </div>
              <div>
                <strong>Next action</strong>
                <span>Further investigation where the evidence warrants it</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-guide-section">
        <div className="container home-guide-card">
          <div className="home-guide-label">
            <span>Latest guide</span>
            <time dateTime={FEATURED_GUIDE.datePublished}>
              {FEATURED_GUIDE.displayDate}
            </time>
          </div>
          <div className="home-guide-copy">
            <p className="eyebrow">{FEATURED_GUIDE.homepageEyebrow}</p>
            <h2>{FEATURED_GUIDE.title}</h2>
            <p>{FEATURED_GUIDE.excerpt}</p>
            <div className="button-row">
              <Link className="button" href={FEATURED_GUIDE.path}>
                Read the guide
              </Link>
              <Link className="text-link" href="/guides">
                Explore all guides <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
          <div className="home-guide-facts" aria-label="Guide highlights">
            {FEATURED_GUIDE.homepageHighlights.map((highlight) => (
              <div key={highlight.label}>
                <span>{highlight.label}</span>
                <strong>{highlight.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section area-section" id="service-areas">
        <div className="container area-grid">
          <div>
            <p className="eyebrow">Service areas</p>
            <h2>Local inspection pages for our priority south-east corridors.</h2>
            <div className="home-area-links" aria-label="Featured service areas">
              {featuredAreas.map((area) => (
                <Link href={`/service-areas/${area.slug}`} key={area.slug}>
                  {area.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p>
              Explore specific guidance for the Mornington Peninsula, Frankston,
              Casey and Cardinia. Other Melbourne and selected Victorian
              addresses are considered according to travel and scheduling.
            </p>
            <Link className="button button-secondary" href="/service-areas">
              Explore service areas
            </Link>
          </div>
        </div>
      </section>

      <section className="section faq-section">
        <div className="container faq-grid">
          <div className="section-heading">
            <p className="eyebrow">Common questions</p>
            <h2>Before you request a quote</h2>
          </div>
          <div className="faq-list">
            {faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container final-cta-inner">
          <div>
            <p className="eyebrow">Ready when you are</p>
            <h2>Tell us what you are buying or building.</h2>
          </div>
          <Link className="button" href="/quote">
            Start your quote
          </Link>
        </div>
      </section>
    </main>
  )
}
