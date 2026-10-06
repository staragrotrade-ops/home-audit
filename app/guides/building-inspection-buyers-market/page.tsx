import Image from 'next/image'
import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { BUYERS_MARKET_GUIDE } from '@/lib/guides'
import { pageMetadata } from '@/lib/metadata'
import { SITE_NAME, SITE_URL } from '@/lib/site'

const guide = BUYERS_MARKET_GUIDE

export const metadata = pageMetadata({
  title: 'When Is a Building Inspection Most Valuable?',
  description: guide.description,
  path: guide.path,
  openGraphType: 'article',
  publishedTime: guide.datePublished,
  modifiedTime: guide.dateModified,
})

const faqs = [
  {
    question: 'Can a building inspection help negotiate the purchase price?',
    answer:
      "It can provide credible evidence for a negotiation, but it does not guarantee a price reduction. The result depends on the findings, competing buyer interest, the seller's position, contract wording and the advice of the buyer's conveyancer or representative.",
  },
  {
    question: 'When should I arrange a building inspection in Victoria?',
    answer:
      'Arrange it before you lose the ability to respond to the findings. For an auction, this commonly means before bidding. For a private sale, inspect before signing or obtain legal advice on an appropriate building-and-pest condition.',
  },
  {
    question: "Is an inspection still worthwhile in a seller's market?",
    answer:
      'Yes. Its main value may be risk control rather than negotiation. It can help you avoid competing blindly for a property with significant visible defects or conditions requiring further investigation.',
  },
  {
    question: 'What defects create the most negotiating leverage?',
    answer:
      'There is no automatic list. Moisture entry, significant building defects, timber-pest evidence, unsafe conditions and expensive specialist investigations generally carry more weight than minor cosmetic or routine maintenance items. The market and the individual property still matter.',
  },
  {
    question: 'Does a building inspector recommend how much to offer?',
    answer:
      'No. A building inspection reports accessible visible conditions and limitations. Market value, contract rights and negotiation strategy should be considered with appropriately qualified property and legal advisers.',
  },
]

const sources = [
  {
    id: 'source-1',
    label: 'Reserve Bank of Australia — Monetary Policy Decision, 29 September 2026',
    href: 'https://www.rba.gov.au/media-releases/2026/mr-26-27.html',
  },
  {
    id: 'source-2',
    label: 'Australian Bureau of Statistics — Consumer Price Index, August 2026',
    href: 'https://www.abs.gov.au/statistics/economy/price-indexes-and-inflation/consumer-price-index-australia/latest-release',
  },
  {
    id: 'source-3',
    label: 'Department of Home Affairs — Permanent Migration Program planning levels',
    href: 'https://immi.homeaffairs.gov.au/what-we-do/migration-program-planning-levels',
  },
  {
    id: 'source-4',
    label: 'Victorian Electoral Commission — 2026 state election',
    href: 'https://www.vec.vic.gov.au/voting/2026-state-election',
  },
  {
    id: 'source-5',
    label: 'State Revenue Office Victoria — COVID Debt Repayment Plan',
    href: 'https://www.sro.vic.gov.au/about-us/rates-and-statistics/covid-debt-repayment-plan',
  },
  {
    id: 'source-6',
    label: 'State Revenue Office Victoria — Vacant residential land tax',
    href: 'https://www.sro.vic.gov.au/owning-property/vacant-residential-land-tax/understanding-vacant-residential-land-tax',
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
          name: 'Guides',
          item: `${SITE_URL}/guides`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: guide.shortTitle,
          item: `${SITE_URL}${guide.path}`,
        },
      ],
    },
    {
      '@type': 'Article',
      '@id': `${SITE_URL}${guide.path}#article`,
      headline: guide.title,
      description: guide.description,
      image: `${SITE_URL}/home-audit-inspector-melbourne.webp`,
      datePublished: guide.datePublished,
      dateModified: guide.dateModified,
      inLanguage: 'en-AU',
      articleSection: 'Property market and pre-purchase inspections',
      author: { '@id': `${SITE_URL}/#organization` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      reviewedBy: { '@id': `${SITE_URL}/credentials#inspector` },
      mainEntityOfPage: { '@id': `${SITE_URL}${guide.path}` },
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: [
        { '@type': 'Thing', name: 'Pre-purchase building inspection' },
        { '@type': 'Thing', name: 'Property negotiation' },
        { '@type': 'Place', name: 'Melbourne, Victoria' },
        { '@type': 'Place', name: 'Carrum Downs, Victoria' },
      ],
      citation: sources.map((source) => source.href),
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}${guide.path}#faq`,
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
}

export default function BuildingInspectionBuyersMarketGuide() {
  return (
    <main id="main-content">
      <JsonLd data={structuredData} />

      <article>
        <header className="guide-hero">
          <div className="container">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">/</span>
              <Link href="/guides">Guides</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">Inspection negotiating power</span>
            </nav>

            <div className="guide-hero-grid">
              <div>
                <p className="eyebrow">Buyer guide · Market insight</p>
                <h1>{guide.title}</h1>
                <p className="guide-deck">
                  The technical value of an inspection is constant. Its
                  negotiating value changes with the property market.
                </p>
                <div className="guide-byline">
                  <span>By {SITE_NAME}</span>
                  <time dateTime={guide.datePublished}>Published {guide.displayDate}</time>
                  {guide.displayModifiedDate ? (
                    <time dateTime={guide.dateModified}>
                      Updated {guide.displayModifiedDate}
                    </time>
                  ) : null}
                  <span>{guide.readingTime}</span>
                </div>
                <p className="guide-reviewer">
                  Reviewed by{' '}
                  <Link href="/credentials">
                    Xiaoqiong Yang, Building Inspector (Limited), IN-L 100094
                  </Link>
                  .
                </p>
              </div>

              <aside className="guide-hero-summary" aria-label="Guide summary">
                <p>In one sentence</p>
                <strong>
                  Inspection findings carry the most commercial weight when a
                  seller cannot easily replace a credible buyer.
                </strong>
                <span>
                  The report supplies the evidence. Market conditions determine
                  how costly that evidence is for the vendor to ignore.
                </span>
              </aside>
            </div>
          </div>
        </header>

        <div className="container guide-layout">
          <aside className="guide-toc" aria-label="On this page">
            <p>On this page</p>
            <nav>
              <a href="#short-answer">The short answer</a>
              <a href="#market-cycle">The market cycle</a>
              <a href="#market-context">Market context</a>
              <a href="#seller-shift">Why sellers listen</a>
              <a href="#real-buyer-case">A real buyer case</a>
              <a href="#right-time">Timing the inspection</a>
              <a href="#use-the-report">Using the report</a>
              <a href="#questions">Questions</a>
              <a href="#sources">Sources</a>
            </nav>
          </aside>

          <div className="guide-article prose">
            <p className="guide-intro">
              A <Link href="/pre-purchase-building-inspection">pre-purchase building inspection</Link>{' '}
              is useful in every market. It can identify visible defects,
              moisture concerns, timber-pest evidence or risk factors, unsafe
              conditions and areas that could not be properly accessed.
            </p>
            <p>
              But the same report can have very different commercial value at
              different points in the property cycle.
            </p>
            <p>
              In a strong seller&apos;s market, an inspection may protect you from
              buying the wrong house but give you limited room to negotiate. The
              vendor may have several other buyers waiting, some willing to sign
              unconditionally.
            </p>
            <p>
              In a softer market, the balance changes. If the property has been
              listed for longer, buyer finance is tighter and the vendor cannot
              easily replace a serious purchaser, documented defects become much
              harder to dismiss.
            </p>

            <section className="guide-short-answer" id="short-answer">
              <p className="eyebrow">The short answer</p>
              <h2>
                A building inspection usually has its greatest negotiating value
                during the transition from a seller&apos;s market to a buyer&apos;s market.
              </h2>
              <p>At that point:</p>
              <ul>
                <li>vendors may still be anchored to yesterday&apos;s price;</li>
                <li>fewer buyers may be able to borrow at the old level;</li>
                <li>listings can take longer to convert;</li>
                <li>buyers have more comparable properties to choose from; and</li>
                <li>
                  losing one credible buyer may mean another campaign, another
                  delay and no certainty that the next offer will be better.
                </li>
              </ul>
              <p>
                The report does not create bargaining power by itself. The market
                makes the findings expensive for the seller to ignore.
              </p>
            </section>

            <figure className="guide-figure">
              <div className="guide-figure-image">
                <Image
                  src="/home-audit-inspector-melbourne.webp"
                  alt="Independent building inspector documenting the condition of a Melbourne home"
                  fill
                  sizes="(max-width: 840px) 100vw, 760px"
                />
              </div>
              <figcaption>
                A useful report separates significant visible defects from
                ordinary maintenance and records what could not be accessed.
              </figcaption>
            </figure>

            <section id="market-cycle">
              <h2>How inspection value changes through the market cycle</h2>
              <div className="guide-table-wrap">
                <table className="guide-table">
                  <caption>
                    The main role of an inspection at four property-market stages
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Market stage</th>
                      <th scope="col">Main value of the inspection</th>
                      <th scope="col">Typical negotiating power</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Hot seller&apos;s market</th>
                      <td>Avoiding a bad purchase and understanding risk before competing</td>
                      <td>Limited, because another buyer may accept the property as-is</td>
                    </tr>
                    <tr>
                      <th scope="row">Cooling or transitional market</th>
                      <td>Identifying defects while vendors are still adjusting expectations</td>
                      <td>Often strongest, because the seller may not want to lose a qualified buyer</td>
                    </tr>
                    <tr>
                      <th scope="row">Established buyer&apos;s market</th>
                      <td>Risk control plus evidence for price, terms or further investigation</td>
                      <td>Strong, although obvious defects may already be reflected in the asking price</td>
                    </tr>
                    <tr>
                      <th scope="row">Early recovery</th>
                      <td>Protecting against renewed urgency and fear of missing out</td>
                      <td>Starts to reduce as buyer competition returns</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                This is why asking only, “Does the house have defects?” misses
                half the value of an inspection. The second question is: <strong>how
                difficult would it be for this vendor to replace me if I walked away?</strong>
              </p>
            </section>

            <section className="market-context" id="market-context">
              <div className="market-context-heading">
                <p className="eyebrow">Dated analysis</p>
                <h2>Market context — 3 October 2026</h2>
                <p>
                  These conditions can change. The date is prominent so the
                  evidence can be reassessed without presenting old data as current.
                </p>
              </div>

              <div className="market-factor">
                <span>01</span>
                <div>
                  <h3>Borrowing conditions are tighter</h3>
                  <p>
                    On 29 September 2026, the Reserve Bank of Australia increased
                    the cash-rate target by 25 basis points to 4.60%. It also noted
                    that housing prices had fallen in most capital cities and new
                    housing loans had declined noticeably.<a className="source-ref" href="#source-1" aria-label="See source 1">1</a>
                  </p>
                  <p>
                    Higher rates reduce borrowing capacity and increase repayment
                    sensitivity. For a seller, a buyer with finance, genuine intent
                    and a realistic settlement plan can therefore be more valuable
                    than the number of online views suggests.
                  </p>
                </div>
              </div>

              <div className="market-factor">
                <span>02</span>
                <div>
                  <h3>Inflation is still consuming household capacity</h3>
                  <p>
                    The ABS reported annual CPI inflation of 4.0% in August 2026.
                    Housing rose 5.7%, while new-dwelling prices rose 5.4% as labour
                    and material costs were passed through.<a className="source-ref" href="#source-2" aria-label="See source 2">2</a>
                  </p>
                  <p>
                    Buyers are assessing more than the mortgage. Insurance, energy,
                    maintenance and rectification work all compete for the same
                    household budget, so a leaking roof, failed wet-area seal or poor
                    stormwater arrangement has an immediate budget consequence.
                  </p>
                </div>
              </div>

              <div className="market-factor">
                <span>03</span>
                <div>
                  <h3>Global uncertainty can keep inflation and confidence unstable</h3>
                  <p>
                    The RBA identified international conflict, energy-price pressure
                    and the possibility of weaker global growth as material
                    uncertainties.<a className="source-ref" href="#source-1" aria-label="See source 1">1</a>
                    Higher input costs can keep inflation and rates elevated, while
                    weaker growth can reduce buyer confidence and transaction activity.
                  </p>
                  <p>
                    Neither outcome makes every home cheaper. It does make buyers
                    more selective and makes a dependable transaction more valuable
                    to sellers.
                  </p>
                </div>
              </div>

              <div className="market-factor">
                <span>04</span>
                <div>
                  <h3>Victoria carries additional property-policy and holding-cost pressure</h3>
                  <p>
                    Victorian property owners and investors face measures including
                    the temporary COVID Debt Repayment Plan land-tax surcharge and,
                    where relevant, vacant residential land tax.<a className="source-ref" href="#source-5" aria-label="See source 5">5</a><a className="source-ref" href="#source-6" aria-label="See source 6">6</a>
                    These do not determine the value of an individual home, but they
                    can affect holding costs and some owners&apos; willingness to wait
                    indefinitely for a preferred price.
                  </p>
                  <p>
                    The Victorian state election is scheduled for 28 November 2026.<a className="source-ref" href="#source-4" aria-label="See source 4">4</a>
                    An election does not automatically cause prices to fall, but
                    uncertainty about future settings can lead some households and
                    investors to postpone a major decision.
                  </p>
                </div>
              </div>

              <div className="market-factor">
                <span>05</span>
                <div>
                  <h3>Migration remains important, but it is not automatic support for every property</h3>
                  <p>
                    Australia&apos;s 2026–27 permanent migration planning level is
                    185,000. Home Affairs also reports that net overseas migration
                    has fallen by more than 40% from its 2023 peak and describes the
                    program as more focused on people already in Australia.<a className="source-ref" href="#source-3" aria-label="See source 3">3</a>
                  </p>
                  <p>
                    This is not the end of migration-driven housing demand. It means
                    buyers and sellers should not assume population growth will
                    support every suburb, property type and price point equally.
                  </p>
                </div>
              </div>
            </section>

            <section id="seller-shift">
              <h2>What changes when a seller can no longer take the buyer for granted?</h2>
              <p>
                In a very strong market, a vendor can respond to an inspection
                concern with: “The property is being sold as-is. There are other
                buyers.” That response is commercially rational when it is true.
              </p>
              <p>In a softer market, the seller has to consider different questions:</p>
              <ul>
                <li>If this buyer leaves, how long will it take to find another?</li>
                <li>Will the next buyer&apos;s finance be as strong?</li>
                <li>Will the same defect be raised again?</li>
                <li>Will a failed transaction make the listing look stale?</li>
                <li>What will another month of interest, advertising and holding costs mean?</li>
              </ul>
              <p>
                The important shift is not that every seller becomes desperate. It
                is that the cost of losing a credible buyer rises.
              </p>
            </section>

            <aside className="practice-callout">
              <p className="eyebrow">What we see in practice</p>
              <h2>A clear report receives more attention when the vendor knows the buyer has alternatives.</h2>
              <p>
                When property sells immediately, findings are often treated mainly
                as the buyer&apos;s risk decision: proceed or walk away. In a more
                selective market, agents and vendors pay closer attention because
                the same issue may be raised by the next purchaser.
              </p>
              <p>
                The strongest report is not an exaggerated list of cosmetic
                imperfections. It distinguishes significant visible defects,
                moisture or timber-pest concerns, safety issues, maintenance items,
                access limitations and matters requiring specialist investigation.
              </p>
            </aside>

            <section className="guide-case-study" id="real-buyer-case">
              <div className="case-study-heading">
                <p className="eyebrow">Real buyer case · Carrum Downs</p>
                <h2>
                  The buyer used documented defects and a repair estimate to
                  negotiate from evidence, not fear.
                </h2>
                <p>
                  This Carrum Downs case involved an occupied single-level
                  brick-veneer unit. The suburb is included as useful local
                  context; the buyer&apos;s name, street address, original inspection
                  company name and all report identifiers have been removed.
                </p>
              </div>

              <div className="case-study-sequence" aria-label="Case study process">
                <article>
                  <span>01</span>
                  <h3>The inspection established a connected defect story</h3>
                  <p>
                    The report recorded cracked roof tiles, deteriorated ridge
                    mortar and staining near a roof valley. Inside, staining to
                    the dining-room wall and roof framing indicated previous
                    water entry. Bathroom moisture, drainage defects and other
                    maintenance items were also documented.
                  </p>
                </article>
                <article>
                  <span>02</span>
                  <h3>The findings were translated into a repair allowance</h3>
                  <p>
                    A standard visual inspection report does not price building
                    work. After the inspection, we helped the buyer separate the
                    priority items from ordinary maintenance and prepare an
                    estimated repair budget for her purchasing decision.
                  </p>
                </article>
                <article>
                  <span>03</span>
                  <h3>The buyer secured a vendor discount and kept control</h3>
                  <p>
                    Using the documented findings together with that estimate,
                    the buyer obtained a discount from the vendor. She moved in
                    30 days later and chose to complete only the repairs she
                    considered priorities.
                  </p>
                </article>
              </div>

              <div className="case-study-report-grid">
                <figure className="case-study-report">
                  <a
                    href="/case-study-roof-report-excerpt.webp"
                    aria-label="Open the full-size anonymised roof report excerpt"
                  >
                    <span className="case-study-report-image">
                      <Image
                        src="/case-study-roof-report-excerpt.webp"
                        alt="Anonymised inspection report excerpt showing cracked roof tiles and deteriorated ridge mortar"
                        fill
                        sizes="(max-width: 840px) 100vw, 370px"
                      />
                    </span>
                  </a>
                  <figcaption>
                    Roof defects documented in the inspection.{' '}
                    <a href="/case-study-roof-report-excerpt.webp">
                      Open full-size excerpt
                    </a>
                  </figcaption>
                </figure>

                <figure className="case-study-report">
                  <a
                    href="/case-study-moisture-report-excerpt.webp"
                    aria-label="Open the full-size anonymised moisture report excerpt"
                  >
                    <span className="case-study-report-image">
                      <Image
                        src="/case-study-moisture-report-excerpt.webp"
                        alt="Anonymised inspection report excerpt showing internal wall staining and evidence of previous roof water entry"
                        fill
                        sizes="(max-width: 840px) 100vw, 370px"
                      />
                    </span>
                  </a>
                  <figcaption>
                    The internal evidence linked to the damaged roof area.{' '}
                    <a href="/case-study-moisture-report-excerpt.webp">
                      Open full-size excerpt
                    </a>
                  </figcaption>
                </figure>
              </div>

              <div className="case-study-outcome">
                <p className="eyebrow">Why the outcome matters</p>
                <h3>The discount gave the buyer options; it did not dictate the repairs.</h3>
                <p>
                  Choosing to defer some work did not make the findings disappear.
                  It meant the buyer could decide what to repair first, while the
                  negotiated discount provided a budget buffer if the remaining
                  items required attention later.
                </p>
              </div>

              <p className="case-study-note">
                <strong>One real outcome, not a promise:</strong> every property,
                contract, vendor and negotiation is different. Inspection findings
                do not guarantee a discount. Contract rights and negotiation
                strategy should be discussed with the buyer&apos;s conveyancer or
                representative.
              </p>
            </section>

            <section id="right-time">
              <h2>An inspection is strongest when it is arranged at the right time</h2>
              <p>
                Negotiating value depends on timing and contract wording. For an
                auction purchase, the inspection will usually need to be completed
                before bidding because an auction contract is commonly unconditional.
              </p>
              <p>
                For a private sale, a buyer may inspect before making an offer or
                rely on a properly drafted building-and-pest condition. The wording,
                deadlines and rights created by that condition are legal matters and
                should be reviewed by a conveyancer before the contract is signed.
              </p>
              <p>
                An inspection completed after the buyer has lost the contractual
                ability to respond may still help with repair planning, but much of
                its negotiating value may already have disappeared.
              </p>
            </section>

            <section id="use-the-report">
              <h2>How to use the report without overplaying your hand</h2>
              <p>
                Turning every minor defect into a demand for a discount can weaken a
                buyer&apos;s credibility. A better process is:
              </p>
              <ol>
                <li>Arrange the inspection early enough to preserve your options.</li>
                <li>Read the scope and access limitations, not only the defect summary.</li>
                <li>
                  Separate safety, moisture, structural and timber-pest concerns from
                  ordinary age and maintenance.
                </li>
                <li>Obtain specialist or trade advice where the evidence warrants it.</li>
                <li>
                  Decide what the findings mean to you: proceed, investigate further,
                  negotiate, change terms or withdraw where legally available.
                </li>
                <li>
                  Use your conveyancer or buyer&apos;s advocate for contract and
                  negotiation strategy.
                </li>
              </ol>
              <p>
                A building inspector reports on accessible visible conditions. The
                inspector does not decide the property&apos;s market value and should not
                replace legal, engineering or specialist advice.
              </p>
            </section>

            <section>
              <h2>Not every property is a buyer&apos;s-market property</h2>
              <p>
                Even in a broad downturn, a well-located home with realistic pricing
                and scarce features may attract several buyers. A soft Melbourne
                index does not guarantee a discount on a particular house.
              </p>
              <p>
                That is another reason to inspect. If the seller has genuine
                competition, the report helps you decide whether the property is
                worth pursuing despite the risk. If there is little competition, the
                same report may also help you negotiate from evidence rather than
                emotion.
              </p>
            </section>

            <section>
              <h2>The real value of inspecting in a difficult market</h2>
              <p>
                A slower market does not make defects more severe. It changes who has
                to absorb their cost. When qualified buyers are scarce, the
                assumption that a vendor can simply pass a problem to the next
                purchaser becomes weaker.
              </p>
              <p>This is the stage in which an inspection can be most commercially effective:</p>
              <ul>
                <li>the buyer has time to investigate;</li>
                <li>alternative properties exist;</li>
                <li>repair costs matter more;</li>
                <li>the vendor values certainty; and</li>
                <li>walking away is a credible option.</li>
              </ul>
              <p>
                The best inspection report does not tell you to buy or not to buy. It
                gives you better evidence at the moment when evidence has the greatest
                negotiating weight.
              </p>
            </section>

            <section className="guide-faq" id="questions" aria-labelledby="guide-faq-heading">
              <p className="eyebrow">Frequently asked questions</p>
              <h2 id="guide-faq-heading">Using an inspection in a property negotiation</h2>
              <div className="faq-list">
                {faqs.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <section className="guide-sources" id="sources" aria-labelledby="guide-sources-heading">
              <p className="eyebrow">Primary sources</p>
              <h2 id="guide-sources-heading">Market information used in this guide</h2>
              <ol>
                {sources.map((source) => (
                  <li id={source.id} key={source.id}>
                    <a href={source.href}>{source.label}</a>
                  </li>
                ))}
              </ol>
              <p>
                Market data was checked on 3 October 2026. General information only;
                it is not legal, financial or property-valuation advice.
              </p>
            </section>

            <aside className="guide-cta">
              <p className="eyebrow">Buying in Melbourne or the Mornington Peninsula?</p>
              <h2>Understand the visible condition before your decision deadline.</h2>
              <p>
                Home Audit provides independent pre-purchase and{' '}
                <Link href="/building-and-pest-inspections">building and pest inspections</Link>{' '}
                with clear findings, scope and access limitations. Explore our{' '}
                <Link href="/service-areas">Melbourne service areas</Link> or request
                an inspection quote.
              </p>
              <div className="button-row">
                <Link className="button" href="/quote?service=building-and-pest">
                  Request an inspection quote
                </Link>
                <Link className="text-link" href="/pre-purchase-building-inspection">
                  Pre-purchase inspection details <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </main>
  )
}
