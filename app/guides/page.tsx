import Image from 'next/image'
import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { GUIDES } from '@/lib/guides'
import { pageMetadata } from '@/lib/metadata'
import { SITE_URL } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Building Inspection Guides Melbourne',
  description:
    'Evidence-led Home Audit guides for Victorian property buyers and new-home owners, including inspection timing, market context, defects and practical due diligence.',
  path: '/guides',
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
          name: 'Guides',
          item: `${SITE_URL}/guides`,
        },
      ],
    },
    {
      '@type': 'CollectionPage',
      '@id': `${SITE_URL}/guides#page`,
      name: 'Home Audit building inspection guides',
      description:
        'Evidence-led guidance for Victorian property buyers and new-home owners.',
      url: `${SITE_URL}/guides`,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: GUIDES.length,
        itemListElement: GUIDES.map((guide, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: guide.title,
          url: `${SITE_URL}${guide.path}`,
        })),
      },
    },
  ],
}

export default function GuidesPage() {
  return (
    <main id="main-content">
      <JsonLd data={structuredData} />

      <section className="page-hero guides-hub-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Home Audit guides</p>
            <h1>Building inspection guidance for better property decisions.</h1>
            <p>
              Market context, inspection timing and practical explanations of
              what visible findings may mean before you buy, bid or negotiate.
            </p>
          </div>
          <div className="page-hero-aside">
            <strong>Written for Victorian buyers and new-home owners</strong>
            <span>Evidence-led · Independently reviewed · Updated monthly</span>
          </div>
        </div>
      </section>

      <section className="section guides-index">
        <div className="container">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">Latest analysis</p>
              <h2>Useful context without pretending every property is the same.</h2>
            </div>
            <p>
              Each guide separates durable inspection principles from dated
              market information, so changing conditions can be updated without
              obscuring the practical answer.
            </p>
          </div>

          <div className="guide-index-list">
            {GUIDES.map((guide, index) => (
              <article className="guide-index-card" key={guide.slug}>
                <div className="guide-index-image">
                  <Image
                    src="/home-audit-inspector-melbourne.webp"
                    alt="Building inspector documenting a residential property in Melbourne"
                    fill
                    sizes="(max-width: 840px) 100vw, 44vw"
                  />
                </div>
                <div className="guide-index-copy">
                  <div className="guide-meta">
                    <span>{guide.category}</span>
                    <time dateTime={guide.datePublished}>{guide.displayDate}</time>
                    <span>{guide.readingTime}</span>
                  </div>
                  <p className="guide-number">Guide {String(index + 1).padStart(2, '0')}</p>
                  <h2>{guide.title}</h2>
                  <p>{guide.excerpt}</p>
                  <Link className="text-link" href={guide.path}>
                    Read the guide <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section editorial-standard">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Our editorial standard</p>
            <h2>Clear about evidence, limits and the date.</h2>
          </div>
          <div className="editorial-standard-grid">
            <article>
              <span>01</span>
              <h3>Primary sources</h3>
              <p>
                Current claims are linked to official sources such as the RBA,
                ABS and Victorian government agencies.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Inspection boundaries</h3>
              <p>
                Guidance distinguishes visible inspection findings from legal,
                market-value, engineering and specialist advice.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Named review</h3>
              <p>
                Technical articles are reviewed by Xiaoqiong Yang, Building
                Inspector (Limited), IN-L 100094.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}
