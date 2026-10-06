import Image from 'next/image'
import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { AGENT_PRESSURE_GUIDE } from '@/lib/guides'
import { pageMetadata } from '@/lib/metadata'
import { SITE_NAME, SITE_URL } from '@/lib/site'

const guide = AGENT_PRESSURE_GUIDE

export const metadata = pageMetadata({
  title: 'Agent Pressure to Skip a Building Inspection',
  description: guide.description,
  path: guide.path,
  openGraphType: 'article',
  publishedTime: guide.datePublished,
  modifiedTime: guide.dateModified,
})

const faqs = [
  {
    question: 'Can a vendor refuse a building inspection in Victoria?',
    answer:
      'Before you have a contractual right of access, a vendor can control access to the property and can reject an offer because of its conditions. That does not make the unknown risk safe. A buyer can inspect before making a binding commitment, negotiate an appropriate condition with legal advice, or decide not to proceed.',
  },
  {
    question: 'Is an unconditional offer more attractive to a seller?',
    answer:
      'It often is, because it gives the seller greater certainty. It also transfers more risk to the buyer. Commercial strength and buyer safety are different questions, so do not remove a condition unless you understand the risk and have obtained appropriate legal advice.',
  },
  {
    question: 'Can I rely on a building report prepared for another buyer?',
    answer:
      'Do not assume that you can. Check who commissioned the report, its date, scope and limitations, whether the inspector accepts you as a client, whether you can ask questions, and what the report terms say about third-party reliance. Whether it gives you enforceable rights is a legal question.',
  },
  {
    question: 'Should I use the building inspector recommended by the selling agent?',
    answer:
      'A recommendation may be convenient, but independence still needs to be verified. Ask about registration, professional indemnity insurance, the inspection scope, any referral or commercial relationship, and who the inspector treats as the client. You are free to choose your own inspector.',
  },
  {
    question: 'Should I make an offer before arranging the inspection?',
    answer:
      'Do not make an unconditional commitment before you understand the likely repair exposure. For an auction, Victorian guidance recommends obtaining the report before bidding. For a private sale, a conveyancer can advise whether an inspection condition is appropriate and how it should be worded.',
  },
]

const sources = [
  {
    id: 'source-1',
    label: 'Consumer Affairs Victoria — Seek expert advice on property',
    href: 'https://www.consumer.vic.gov.au/housing/buying-and-selling-property/buying-property/seek-expert-advice-on-property',
  },
  {
    id: 'source-2',
    label: 'Consumer Affairs Victoria — Inspect properties before you buy',
    href: 'https://www.consumer.vic.gov.au/housing/buying-and-selling-property/buying-property/inspect-properties-before-you-buy',
  },
  {
    id: 'source-3',
    label: 'Consumer Affairs Victoria — Buying property by private sale',
    href: 'https://www.consumer.vic.gov.au/housing/buying-and-selling-property/buying-property/buying-property-by-private-sale',
  },
  {
    id: 'source-4',
    label: 'Consumer Affairs Victoria — Buying property at auction',
    href: 'https://www.consumer.vic.gov.au/housing/buying-and-selling-property/buying-property/buying-property-at-auction',
  },
  {
    id: 'source-5',
    label: 'Consumer Affairs Victoria — Advertising and representations: estate agent obligations',
    href: 'https://www.consumer.vic.gov.au/licensing-and-registration/estate-agents/running-your-business/advertising-and-representations',
  },
  {
    id: 'source-6',
    label: 'Victorian Government — First home buyer guide',
    href: 'https://www.vic.gov.au/first-home-buyer-guide',
  },
  {
    id: 'source-7',
    label: 'The Guardian — Victorian buyers describe the cost and value of repeated inspections, 14 March 2026',
    href: 'https://www.theguardian.com/australia-news/2026/mar/14/victoria-property-building-inspections-should-sellers-bear-cost',
  },
  {
    id: 'source-8',
    label: 'Reddit r/AusProperty — Public buyer account of inspection access being refused (anecdotal)',
    href: 'https://www.reddit.com/r/AusProperty/comments/1jgd448/vendor_denying_building_inspection_during_cooling/',
  },
  {
    id: 'source-9',
    label: 'Reddit r/AusPropertyChat — Public discussion of conditional and unconditional offers (anecdotal)',
    href: 'https://www.reddit.com/r/AusPropertyChat/comments/1rfwnug/highest_bidder_but_still_losing_to_unconditional/',
  },
  {
    id: 'source-10',
    label: 'PropertyChat — Public discussion of seller-supplied and on-sold inspection reports (anecdotal)',
    href: 'https://www.propertychat.com.au/community/threads/sharing-the-cost-of-b-p-inspection-among-prospective-buyers.12750/',
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
      articleSection: 'Buyer protection and pre-purchase inspections',
      author: { '@id': `${SITE_URL}/#organization` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      reviewedBy: { '@id': `${SITE_URL}/credentials#inspector` },
      mainEntityOfPage: { '@id': `${SITE_URL}${guide.path}` },
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: [
        { '@type': 'Thing', name: 'Pre-purchase building inspection' },
        { '@type': 'Thing', name: 'Unconditional property offer' },
        { '@type': 'Thing', name: 'Property buyer due diligence' },
        { '@type': 'Place', name: 'Dromana, Victoria' },
        { '@type': 'Place', name: 'Victoria, Australia' },
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

export default function AgentPressureBuildingInspectionGuide() {
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
              <span aria-current="page">Agent pressure and inspections</span>
            </nav>

            <div className="guide-hero-grid">
              <div>
                <p className="eyebrow">Buyer guide · Buyer protection</p>
                <h1>{guide.title}</h1>
                <p className="guide-deck">
                  The pressure may be genuine. The unknown building risk still
                  becomes yours after settlement.
                </p>
                <div className="guide-byline">
                  <span>By {SITE_NAME}</span>
                  <time dateTime={guide.datePublished}>Published {guide.displayDate}</time>
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
                  A seller may prefer an unconditional buyer, but you—not the
                  selling agent—will own the defects after settlement.
                </strong>
                <span>
                  Do not trade away independent information merely to make your
                  offer easier for the vendor to accept.
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
              <a href="#whose-agent">Whose agent is it?</a>
              <a href="#pressure-lines">Seven pressure lines</a>
              <a href="#dromana-case">Dromana, Victoria case</a>
              <a href="#buyer-plan">Buyer response plan</a>
              <a href="#before-offer">Before making an offer</a>
              <a href="#what-to-say">What to say</a>
              <a href="#questions">Questions</a>
              <a href="#sources">Sources</a>
            </nav>
          </aside>

          <div className="guide-article prose">
            <p className="guide-intro">
              A selling agent may tell you that the owner will not allow a
              building inspection, your price is too low to include conditions,
              or another buyer is ready to sign unconditionally. Any of those
              statements may be true. None tells you whether the house is safe
              to buy without understanding its visible defects, access limits
              and likely repair exposure.
            </p>
            <p>
              The practical question is not, “Can I prove the agent is bluffing?”
              It is: <strong>“Am I willing to own this property at this price if
              the unknown problem becomes expensive after settlement?”</strong>
            </p>

            <section className="guide-short-answer" id="short-answer">
              <p className="eyebrow">The short answer</p>
              <h2>Keep the decision about inspection separate from the pressure to win.</h2>
              <p>A buyer usually has two disciplined paths:</p>
              <ol>
                <li>
                  complete an independent inspection before making an
                  unconditional offer or bidding at auction; or
                </li>
                <li>
                  for a private sale, ask a conveyancer to prepare or review an
                  appropriate building-and-pest condition before signing.
                </li>
              </ol>
              <p>
                Consumer Affairs Victoria recommends considering a qualified
                professional inspection before signing and notes that its cost is
                small compared with extensive unforeseen repairs.
                <a className="source-ref" href="#source-2" aria-label="See source 2">2</a>
                If neither path is permitted, the choice is not “buy safely or
                lose the property”. It is “accept the unknown risk or walk away”.
              </p>
            </section>

            <figure className="guide-figure">
              <div className="guide-figure-image">
                <Image
                  src="/home-audit-inspector-melbourne.webp"
                  alt="Independent building inspector documenting a Victorian home for a buyer"
                  fill
                  sizes="(max-width: 840px) 100vw, 760px"
                />
              </div>
              <figcaption>
                An independent inspection is information for the buyer—not a
                promise that every defect will be visible or accessible.
              </figcaption>
            </figure>

            <section id="whose-agent">
              <h2>The selling agent is doing a job—but it is not your job</h2>
              <p>
                The selling agent&apos;s main responsibility is to the seller.
                Consumer Affairs Victoria distinguishes that role from a
                buyer&apos;s advocate, who is engaged to act for the buyer.
                <a className="source-ref" href="#source-1" aria-label="See source 1">1</a>
                The agent is therefore expected to seek the strongest price and
                terms the seller can obtain.
              </p>
              <p>
                That does not make the agent your enemy, and it does not mean
                every competing offer or access problem is invented. A seller
                can prefer certainty and can reject a private-sale offer because
                of its conditions.
                <a className="source-ref" href="#source-3" aria-label="See source 3">3</a>
                It does mean the agent&apos;s recommendation should not replace your
                own inspection, legal advice or risk limit.
              </p>
              <p>
                Agents also have legal obligations: misleading or deceptive
                conduct and representations are prohibited, and spoken statements
                can count as representations.
                <a className="source-ref" href="#source-5" aria-label="See source 5">5</a>
                Rather than arguing in the driveway, keep important statements
                and your offer terms in writing.
              </p>
            </section>

            <section id="pressure-lines">
              <p className="eyebrow">Common pressure lines</p>
              <h2>Seven ways a buyer can be pushed away from independent due diligence</h2>
              <p>
                These statements are not automatically dishonest. They become
                dangerous when urgency is treated as evidence that an inspection
                is unnecessary.
              </p>

              <div className="pressure-pattern-list">
                <article className="pressure-pattern">
                  <span>01</span>
                  <div>
                    <p className="pressure-label">Pressure line</p>
                    <h3>“The owner will not agree to a building inspection.”</h3>
                    <p>
                      This may mean the seller refuses an inspection condition,
                      refuses access before signing, or simply dislikes the
                      proposed time. Those are different facts. Ask which one is
                      being refused and request the answer in writing.
                    </p>
                    <p className="pressure-response">
                      <strong>Buyer response:</strong> offer alternative access
                      times, inspect before offering, use a legally reviewed
                      condition, or do not buy without access. Public buyer
                      discussions show that access refusal during time-sensitive
                      negotiations is not merely theoretical.
                      <a className="source-ref" href="#source-8" aria-label="See source 8">8</a>
                    </p>
                  </div>
                </article>

                <article className="pressure-pattern">
                  <span>02</span>
                  <div>
                    <p className="pressure-label">Pressure line</p>
                    <h3>“Your offer is too low to ask for conditions.”</h3>
                    <p>
                      Price and risk are being bundled together. A lower price
                      does not make hidden moisture, roof failure, drainage or
                      subfloor problems less expensive after settlement.
                    </p>
                    <p className="pressure-response">
                      <strong>Buyer response:</strong> decide the price and the
                      conditions you require, then present both clearly. The
                      seller can reject them, but you do not have to improve an
                      offer by accepting an unmeasured repair liability.
                    </p>
                  </div>
                </article>

                <article className="pressure-pattern">
                  <span>03</span>
                  <div>
                    <p className="pressure-label">Pressure line</p>
                    <h3>“There is another unconditional offer.”</h3>
                    <p>
                      It may be accurate: unconditional terms often have real
                      commercial value to a seller. Public buyer discussions
                      repeatedly describe higher conditional offers losing to
                      cleaner offers.
                      <a className="source-ref" href="#source-9" aria-label="See source 9">9</a>
                    </p>
                    <p className="pressure-response">
                      <strong>Buyer response:</strong> do not copy another
                      person&apos;s risk tolerance. Ask what decision deadline
                      actually applies, keep your maximum exposure unchanged and
                      submit the strongest offer that remains safe for you.
                    </p>
                  </div>
                </article>

                <article className="pressure-pattern">
                  <span>04</span>
                  <div>
                    <p className="pressure-label">Pressure line</p>
                    <h3>“Make the offer now and inspect afterwards.”</h3>
                    <p>
                      The words “afterwards” are meaningless unless you know what
                      contractual right still exists then. A cooling-off period,
                      an inspection condition and a pre-settlement inspection are
                      not interchangeable.
                    </p>
                    <p className="pressure-response">
                      <strong>Buyer response:</strong> have your conveyancer
                      explain the exact contract wording before signing. For an
                      auction, arrange the inspection first: a successful bidder
                      generally cannot add new conditions unless the seller agrees.
                      <a className="source-ref" href="#source-4" aria-label="See source 4">4</a>
                    </p>
                  </div>
                </article>

                <article className="pressure-pattern">
                  <span>05</span>
                  <div>
                    <p className="pressure-label">Pressure line</p>
                    <h3>“Someone has already inspected it—you can buy their report.”</h3>
                    <p>
                      A cheap existing report can feel like the same product. It
                      may not be the same client relationship. The report could
                      have been commissioned by the seller or agent, or by a
                      genuine earlier buyer. Each origin creates different
                      questions about scope, <strong>independence</strong>,
                      currency, access and whether you can rely on it.
                    </p>
                    <p className="pressure-response">
                      <strong>Buyer response:</strong> do not assume a report is
                      independent simply because it was prepared by a qualified
                      inspector. An inspector may receive regular referrals from
                      an agent, rely on that agent for future work, or describe
                      defects in softer and more reassuring language to avoid
                      disrupting the sale. This does not automatically make the
                      report inaccurate, but it creates a potential conflict that
                      the buyer should investigate. Ask who selected, instructed
                      and paid the inspector, whether the inspector has an ongoing
                      referral relationship with the agent, and whether the
                      inspector will accept responsibility to you in writing. The
                      safer option is to appoint an inspector you choose—someone
                      who reports directly to you, answers your questions and has
                      no interest in keeping the selling agent satisfied.
                    </p>
                  </div>
                </article>

                <article className="pressure-pattern">
                  <span>06</span>
                  <div>
                    <p className="pressure-label">Pressure line</p>
                    <h3>“Use our inspector; they already know the property.”</h3>
                    <p>
                      Familiarity and speed can be useful, but neither proves
                      independence. A referral relationship is not automatically
                      improper; it is something the buyer should understand.
                    </p>
                    <p className="pressure-response">
                      <strong>Buyer response:</strong> choose the inspector
                      yourself. Verify registration where relevant, professional
                      indemnity insurance, scope, access requirements, who pays,
                      who receives the report and whether any referral or commercial
                      relationship exists.
                    </p>
                  </div>
                </article>

                <article className="pressure-pattern">
                  <span>07</span>
                  <div>
                    <p className="pressure-label">Pressure line</p>
                    <h3>“You have already missed several homes—do not lose this one.”</h3>
                    <p>
                      This message is most effective when the buyer has already
                      disclosed a lease deadline, failed offers, family pressure,
                      school timing or fear of missing out. Those details reveal
                      how hard you may be pushed.
                    </p>
                    <p className="pressure-response">
                      <strong>Buyer response:</strong> be polite but private. The
                      agent needs your offer, conditions and decision deadline—not
                      your emotional history, maximum budget or how desperate you
                      feel to secure a home.
                    </p>
                  </div>
                </article>
              </div>
            </section>

            <section className="guide-case-study dromana-case" id="dromana-case">
              <div className="case-study-heading">
                <p className="eyebrow">Case note · Dromana, Victoria · Details anonymised</p>
                <h2>An existing report was offered as the convenient alternative to a new inspection.</h2>
                <p>
                  In this Dromana, Victoria case, the buyer was given access to a
                  report from an earlier inspection instead of commissioning a
                  fresh inspection. The suburb and state are retained as relevant
                  local context; the street address, buyer, agent, vendor,
                  inspector and report identifiers are not published.
                </p>
              </div>

              <div className="report-origin-grid" aria-label="Two possible sources of an existing report">
                <article>
                  <span>Report source A</span>
                  <h3>Commissioned for the seller or sales process</h3>
                  <p>
                    The report may be professionally prepared, but the buyer did
                    not choose the consultant or define the scope. The buyer
                    should verify who the client is, how the inspector was selected,
                    what was accessible and whether any relationship or limitation
                    affects independence or reliance.
                  </p>
                </article>
                <article>
                  <span>Report source B</span>
                  <h3>Originally commissioned by another genuine buyer</h3>
                  <p>
                    A report may have been genuinely commissioned by an earlier
                    buyer and still be the wrong basis for a later buyer&apos;s
                    decision. In this case, the selling agent offered the later
                    buyer an existing report prepared by another buyer&apos;s
                    inspector. The later buyer relied on it and did not commission
                    an independent inspection of their own.
                  </p>
                </article>
              </div>

              <div className="dromana-story" aria-labelledby="dromana-story-heading">
                <div className="dromana-story-heading">
                  <p className="eyebrow">Real buyer case · Dromana, Victoria</p>
                  <h3 id="dromana-story-heading">
                    The report looked like due diligence. The consequences arrived
                    after settlement.
                  </h3>
                  <p>
                    The buyer proceeded on the strength of the report supplied
                    through the sales process. After settlement, a structural
                    problem was discovered. By then, the buyer owned the property
                    and the issue was no longer part of a purchasing decision or
                    negotiation—it had become the family&apos;s responsibility.
                  </p>
                </div>

                <div className="case-study-sequence dromana-story-sequence" aria-label="Dromana, Victoria buyer case sequence">
                  <article>
                    <span>01</span>
                    <h3>The existing report replaced a fresh engagement</h3>
                    <p>
                      The buyer used a report originally prepared by the inspector
                      engaged by another buyer. The current buyer did not select
                      that inspector, define the scope or receive a new inspection
                      performed solely for their decision.
                    </p>
                  </article>
                  <article>
                    <span>02</span>
                    <h3>A structural problem emerged after settlement</h3>
                    <p>
                      The problem became apparent only after the purchase had
                      settled. Further assessment and major rectification were then
                      required while the buyer was already legally and financially
                      committed to the home.
                    </p>
                  </article>
                  <article>
                    <span>03</span>
                    <h3>The direct financial loss reached about A$70,000</h3>
                    <p>
                      Structural repairs were only part of the cost. The family
                      also had to move out, pay for temporary rental accommodation,
                      and then pay and organise another move back after the work was
                      completed.
                    </p>
                  </article>
                  <article>
                    <span>04</span>
                    <h3>The loss extended far beyond the invoices</h3>
                    <p>
                      The disruption affected the whole household. The child had
                      to change schools, normal routines were broken, and the family
                      carried months of uncertainty, lost time and stress that the
                      approximately A$70,000 financial loss could not measure.
                    </p>
                  </article>
                </div>
              </div>

              <div className="case-study-outcome">
                <p className="eyebrow">The question that matters</p>
                <h3>Did you buy a copy, or did the inspector accept responsibility to you?</h3>
                <p>
                  A report written for another party may not automatically give a
                  later buyer the same contractual relationship or rights. Before
                  relying on it, obtain the terms, speak directly with the inspector
                  and ask for written confirmation of your status. Whether a report
                  is legally enforceable by a later buyer depends on its terms and
                  circumstances and should be discussed with a conveyancer or lawyer.
                </p>
              </div>

              <p className="case-study-note">
                This anonymised case does not establish that the agent or original
                inspector knew about the structural problem, and it does not mean
                every shared or on-sold report is inaccurate. It shows why price
                and convenience do not answer independence, completeness or
                legal-reliance questions. Public buyer accounts also include
                examples where an independent follow-up found significant items
                missing from a seller-supplied report.
                <a className="source-ref" href="#source-10" aria-label="See source 10">10</a>
                A separate Home Audit guide will examine report ownership,
                third-party reliance and on-sale terms in detail.
              </p>
            </section>

            <section id="buyer-plan">
              <p className="eyebrow">A disciplined response</p>
              <h2>Protect the decision before you fall in love with the property</h2>
              <div className="buyer-plan-grid">
                <article>
                  <span>01</span>
                  <h3>Set non-negotiables early</h3>
                  <p>
                    Decide before the campaign whether you require building,
                    timber-pest, asbestos, drainage or specialist advice. A rule
                    made calmly is harder to abandon under deadline pressure.
                  </p>
                </article>
                <article>
                  <span>02</span>
                  <h3>Keep urgency private</h3>
                  <p>
                    Do not volunteer your lease expiry, missed purchases, school
                    deadline, maximum borrowing capacity or how urgently your
                    family needs to move.
                  </p>
                </article>
                <article>
                  <span>03</span>
                  <h3>Separate fact from sales language</h3>
                  <p>
                    Ask what is actually being refused, when a decision is required
                    and whether another offer is signed or merely expected. You may
                    not receive every detail, but the question clarifies your own choice.
                  </p>
                </article>
                <article>
                  <span>04</span>
                  <h3>Choose your own advisers</h3>
                  <p>
                    Your inspector and conveyancer should answer to you. Independent
                    selection does not guarantee perfection, but it removes an
                    avoidable alignment problem.
                  </p>
                </article>
                <article>
                  <span>05</span>
                  <h3>Price after repair exposure</h3>
                  <p>
                    Before locking in an unconditional amount, understand which
                    visible findings require trade estimates or specialist review.
                    The purchase price is only one part of the cost of ownership.
                  </p>
                </article>
                <article>
                  <span>06</span>
                  <h3>Be willing to lose one property</h3>
                  <p>
                    A genuine competing buyer may win. That is disappointing, but
                    it is not proof that accepting unknown risk would have been the
                    better financial decision.
                  </p>
                </article>
              </div>
              <p>
                Victorian reporting in 2026 included buyers who paid for several
                inspections but avoided homes with structural or drainage problems.
                One buyer described the inspection cost as small compared with the
                repair liability she avoided.
                <a className="source-ref" href="#source-7" aria-label="See source 7">7</a>
              </p>
            </section>

            <section id="before-offer">
              <h2>Before making an offer, answer these seven questions</h2>
              <div className="guide-table-wrap">
                <table className="guide-table">
                  <caption>Buyer checks before making an offer on a Victorian property</caption>
                  <thead>
                    <tr>
                      <th scope="col">Question</th>
                      <th scope="col">Why it matters</th>
                      <th scope="col">Who should answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Is this an auction or private sale?</th>
                      <td>It changes when conditions and inspection timing remain available.</td>
                      <td>Agent and conveyancer</td>
                    </tr>
                    <tr>
                      <th scope="row">Will access be provided before I am bound?</th>
                      <td>No access means accepting conditions you have not independently assessed.</td>
                      <td>Agent or vendor</td>
                    </tr>
                    <tr>
                      <th scope="row">Who selected and engaged the inspector?</th>
                      <td>It identifies the client relationship and possible conflicts.</td>
                      <td>Inspector directly</td>
                    </tr>
                    <tr>
                      <th scope="row">What areas were inaccessible?</th>
                      <td>A clean summary is less meaningful if the roof, subfloor or wet areas were limited.</td>
                      <td>Inspector and report</td>
                    </tr>
                    <tr>
                      <th scope="row">Can I rely on this report?</th>
                      <td>Paying for a copy may not create the same rights as commissioning the work.</td>
                      <td>Inspector and legal adviser</td>
                    </tr>
                    <tr>
                      <th scope="row">What needs further investigation or pricing?</th>
                      <td>The offer should reflect unresolved repair and specialist costs.</td>
                      <td>Inspector and relevant trades</td>
                    </tr>
                    <tr>
                      <th scope="row">What exactly does my contract let me do?</th>
                      <td>Inspection findings only help if the timing and clause preserve a response.</td>
                      <td>Conveyancer or lawyer</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                The Victorian Government&apos;s first-home buyer guidance recommends
                obtaining an inspection before an auction and considering a
                building-inspection condition for a private sale.
                <a className="source-ref" href="#source-6" aria-label="See source 6">6</a>
              </p>
              <p>
                Contract wording can also change what happens after a report
                identifies a serious defect. See our guide to{' '}
                <Link href="/guides/major-building-defect-vs-major-structural-defect-victoria">
                  major building defect and major structural defect clauses
                </Link>
                .
              </p>
            </section>

            <section id="what-to-say">
              <p className="eyebrow">Plain-English responses</p>
              <h2>What to say without turning the negotiation into an argument</h2>
              <div className="buyer-script-list">
                <blockquote>
                  <p>
                    “Please confirm whether the vendor is refusing access, refusing
                    an inspection condition, or only declining the proposed time.
                    I will decide once that is clear.”
                  </p>
                </blockquote>
                <blockquote>
                  <p>
                    “I understand another offer may be unconditional. My offer and
                    conditions reflect the level of risk I am prepared to accept.”
                  </p>
                </blockquote>
                <blockquote>
                  <p>
                    “I will arrange my own inspector. Please liaise with my
                    inspector to book a building and pest inspection.”
                  </p>
                </blockquote>
              </div>
              <p>
                Calm wording matters. You are not accusing the agent or seller of
                hiding a defect. You are stating the information and terms required
                for your own decision.
              </p>
            </section>

            <section>
              <h2>The inspection is not a weapon—and it is not a guarantee</h2>
              <p>
                A standard pre-purchase inspection is visual and non-invasive. It
                cannot expose every concealed defect, and weather, occupancy, stored
                contents and safe access can limit what is seen. The report should
                state those limitations and identify when specialist investigation
                is warranted.
              </p>
              <p>
                The aim is not to manufacture a reason to renegotiate. It is to
                replace avoidable uncertainty with the best accessible evidence
                before the buyer becomes responsible for the property.
              </p>
            </section>

            <section className="guide-faq" id="questions" aria-labelledby="guide-faq-heading">
              <p className="eyebrow">Frequently asked questions</p>
              <h2 id="guide-faq-heading">Agent pressure and buyer inspections</h2>
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
              <p className="eyebrow">Sources and public examples</p>
              <h2 id="guide-sources-heading">Guidance used in this article</h2>
              <ol>
                {sources.map((source) => (
                  <li id={source.id} key={source.id}>
                    <a href={source.href}>{source.label}</a>
                  </li>
                ))}
              </ol>
              <p>
                Official Victorian guidance is separated from media reporting and
                anecdotal public discussions. Public posts illustrate pressure
                patterns; they do not establish how often those patterns occur.
                Sources were checked on 4 October 2026.
              </p>
              <p>
                General information only. This article is not legal advice and does
                not allege misconduct by any person or agency. Contract wording,
                access rights and reliance on a third-party report should be
                discussed with an appropriately qualified legal adviser.
              </p>
            </section>

            <aside className="related-guide-card">
              <p className="eyebrow">Related Home Audit guide</p>
              <h2>When does an inspection have the most negotiating power?</h2>
              <p>
                See how seller alternatives and market conditions change the
                commercial weight of documented defects—including a real Carrum
                Downs buyer case.
              </p>
              <Link className="text-link" href="/guides/building-inspection-buyers-market">
                Read the market guide <span aria-hidden="true">→</span>
              </Link>
            </aside>

            <aside className="guide-cta">
              <p className="eyebrow">Buying in Melbourne or the Mornington Peninsula?</p>
              <h2>Choose the inspector before the sales pressure chooses for you.</h2>
              <p>
                Home Audit provides independent{' '}
                <Link href="/pre-purchase-building-inspection">pre-purchase</Link>{' '}
                and <Link href="/building-and-pest-inspections">building and pest inspections</Link>{' '}
                with clear findings, scope and access limitations. Explore our{' '}
                <Link href="/service-areas">service areas</Link> or request a quote.
              </p>
              <div className="button-row">
                <Link className="button" href="/quote?service=building-and-pest">
                  Request an inspection quote
                </Link>
                <Link className="text-link" href="/guides">
                  Explore all guides <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </main>
  )
}
