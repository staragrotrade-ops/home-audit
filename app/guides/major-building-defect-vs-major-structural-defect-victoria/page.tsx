import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { DEFECT_CLAUSE_GUIDE } from '@/lib/guides'
import { pageMetadata } from '@/lib/metadata'
import { SITE_URL } from '@/lib/site'

const guide = DEFECT_CLAUSE_GUIDE

export const metadata = pageMetadata({
  title: 'Major Building Defect vs Major Structural Defect in Victoria',
  description: guide.description,
  path: guide.path,
  openGraphType: 'article',
  publishedTime: guide.datePublished,
  modifiedTime: guide.dateModified,
})

type Paragraph = {
  text: string
  refs?: readonly number[]
}

type RedFlag = {
  number: string
  title: string
  paragraphs: readonly Paragraph[]
}

const sources = [
  {
    id: 'source-1',
    label:
      'Legal Practitioners’ Liability Committee — Lessons when terminating for major building defects (Willis v Crosland [2021] VSCA 320)',
    href: 'https://lplc.com.au/resources/lplc-article/lessons-when-terminating-for-major-building-defects',
  },
  {
    id: 'source-2',
    label:
      'Standard-form Victorian contract of sale of land — General Conditions 21 (Building report) and 22 (Pest report), and the cooling-off notice, as printed in the contract reviewed for this guide',
    href: '',
  },
  {
    id: 'source-3',
    label: 'Consumer Affairs Victoria — Inspect properties before you buy',
    href: 'https://www.consumer.vic.gov.au/housing/buying-and-selling-property/buying-property/inspect-properties-before-you-buy',
  },
  {
    id: 'source-4',
    label: 'Consumer Affairs Victoria — Seek expert advice on property',
    href: 'https://www.consumer.vic.gov.au/housing/buying-and-selling-property/buying-property/seek-expert-advice-on-property',
  },
  {
    id: 'source-5',
    label: 'Consumer Affairs Victoria — Buying property at auction',
    href: 'https://www.consumer.vic.gov.au/housing/buying-and-selling-property/buying-property/buying-property-at-auction',
  },
  {
    id: 'source-6',
    label:
      'Consumer Affairs Victoria — Due diligence checklist for home and residential property buyers',
    href: 'https://www.consumer.vic.gov.au/housing/buying-and-selling-property/checklists/due-diligence',
  },
  {
    id: 'source-7',
    label: 'Consumer Affairs Victoria — Owner builders',
    href: 'https://www.consumer.vic.gov.au/housing/building-and-renovating/owner-builders',
  },
  {
    id: 'source-8',
    label: 'Consumer Affairs Victoria — Records (owners corporations)',
    href: 'https://www.consumer.vic.gov.au/housing/owners-corporations/finance-insurance-and-record-keeping/records',
  },
]

const publicExample = {
  id: 'source-9',
  label: 'PropertyChat — “B&P report and Major Defects” (public buyer discussion)',
  href: 'https://www.propertychat.com.au/community/threads/b-p-report-and-major-defects-urgent-advice-needed.55208/',
}

const standardWording = [
  'Applies only if the Building Report box in the particulars of sale is selected',
  'Refers to a current defect in a structure on the land',
  'Uses the term “major building defect”',
  'Allows 14 days from the day of sale',
  'Requires a written report from a registered building practitioner or architect',
  'Requires the report and a written notice ending the contract to be given to the vendor',
  'Requires the purchaser not to be in default at that time',
]

const restrictiveWording = [
  'Used the phrase “Major Structural Defect”',
  'Required the report to state that phrase',
  'Allowed seven days from the purchaser signing',
  'Referred to a Registered Building Inspector',
  'Required the report and written notice within the same seven-day period',
]

const contractFlags: readonly RedFlag[] = [
  {
    number: '01',
    title: 'The Building Report box is blank',
    paragraphs: [
      {
        text: 'General Condition 21 states that it applies only if the relevant box in the particulars of sale is checked. A heading called “Building report” elsewhere in the document does not necessarily activate the standard condition.',
        refs: [2],
      },
      {
        text: 'Ask the conveyancer which clause, if any, gives the buyer an inspection-based right to terminate.',
      },
    ],
  },
  {
    number: '02',
    title: 'A special condition deletes or replaces GC21',
    paragraphs: [
      {
        text: 'Special conditions can materially change a familiar standard-form contract. Search for words such as “delete”, “replace”, “despite”, “notwithstanding” and “prevails”. Also check whether a new special condition uses the same number as a general condition, because that can make a quick reading confusing.',
      },
      {
        text: 'What matters is the wording in the contract you are about to sign, which may differ from the standard form.',
      },
    ],
  },
  {
    number: '03',
    title: '“Major building defect” becomes “major structural defect”',
    paragraphs: [
      {
        text: 'This change may leave you with less protection. An older home can have expensive problems with water entry, roofing, drainage, the subfloor or safety that are serious without being structural.',
      },
      {
        text: 'Whether a particular problem meets either phrase depends on the contract and the evidence. Neither phrase gives a buyer an automatic right to leave.',
      },
    ],
  },
  {
    number: '04',
    title: 'The report must contain an exact phrase',
    paragraphs: [
      {
        text: 'Look for wording such as “the report states the phrase” or “expressly states”. A clause like this can be harder to satisfy than one that only asks whether the report identifies a certain type of defect.',
      },
      {
        text: 'Send the clause to the inspector before the inspection, and ask your legal adviser what it requires.',
      },
    ],
  },
  {
    number: '05',
    title: 'Fourteen days becomes seven, three or fewer',
    paragraphs: [
      {
        text: 'In that time you have to arrange access, book the inspector, have the inspection done, receive and read the report, and serve any notice. If the clause counts ordinary days, a weekend or public holiday leaves you even less time.',
      },
      {
        text: 'Have the legal adviser calculate the deadline. Do not rely on an agent’s verbal estimate.',
      },
    ],
  },
  {
    number: '06',
    title: 'The required qualification has changed',
    paragraphs: [
      {
        text: 'The standard-form wording refers to a registered building practitioner or architect. A special condition may use a different or narrower description. If the person preparing the report does not fit the contract wording, the vendor may challenge reliance on the report even when the physical findings are serious.',
        refs: [1, 2, 9],
      },
      {
        text: 'Before booking, confirm the inspector’s registration class and number, professional indemnity insurance and whether the contract accepts that category of practitioner.',
      },
    ],
  },
  {
    number: '07',
    title: 'The buyer obtains a report but does not serve a notice',
    paragraphs: [
      {
        text: 'Getting the report is only the first step. GC21 also requires you to give the vendor a copy of the report and a written notice ending the contract, both within the required period.',
        refs: [2],
      },
      {
        text: 'Send the report to your own lawyer or conveyancer straight away and let them handle the notice. A text or email to the selling agent may not be enough.',
      },
    ],
  },
  {
    number: '08',
    title: 'The buyer is already in default',
    paragraphs: [
      {
        text: 'The standard-form condition also refers to the purchaser being “not then in default”. In Willis v Crosland, the Court considered whether the buyer was actually in breach at the time notice was served.',
        refs: [1],
      },
      {
        text: 'Make sure the deposit and any other early obligations have been met on time, or the vendor may argue you cannot rely on the inspection condition.',
      },
    ],
  },
  {
    number: '09',
    title: 'The pest condition only covers a current infestation affecting the structure',
    paragraphs: [
      {
        text: 'The standard-form pest condition refers to a current pest infestation designated as a major infestation affecting the structure of a building on the land. A special condition may go further and demand an exact phrase such as “Major Pest Infestation”.',
        refs: [2],
      },
      {
        text: 'An older home can have a lot of old termite damage even when no live termites are found on the day. Old damage may not count as a current infestation under the clause.',
      },
    ],
  },
  {
    number: '10',
    title: 'Cooling-off and the building condition are being treated as the same thing',
    paragraphs: [
      {
        text: 'For an eligible Victorian private sale, the cooling-off right is separate from the building-report condition. The standard contract notice provides three clear business days, subject to exceptions and a financial deduction. Auction purchases, and purchases close to a publicly advertised auction, are among the exceptions.',
        refs: [2, 5],
      },
      {
        text: 'If someone says, “You can only cool off if there is a major structural defect,” get immediate advice from the buyer’s own lawyer or conveyancer.',
      },
    ],
  },
]

const propertyFlags: readonly RedFlag[] = [
  {
    number: '11',
    title: 'The property is sold “as inspected” with broad no-claim wording',
    paragraphs: [
      {
        text: 'One vendor-prepared contract reviewed for this guide stated that improvements were sold as inspected and sought to prevent claims relating to deficiencies, defects, regulatory compliance, permits and authority inspections.',
      },
      {
        text: 'A clause like that shifts risk onto the buyer. It does not mean the home is defective, but it is a good reason to get legal advice, an independent inspection and council records before signing.',
      },
    ],
  },
  {
    number: '12',
    title: 'The agent or seller already has a convenient report',
    paragraphs: [
      {
        text: 'Consumer Affairs Victoria tells buyers to be wary of a report offered by the agent or seller, and says getting your own report is the only way to make sure it is independent and accurate.',
        refs: [3],
      },
      {
        text: 'Ask who commissioned the existing report, who the client is, what was accessible, whether it is current and whether the inspector accepts responsibility to the new buyer.',
      },
    ],
  },
  {
    number: '13',
    title: 'The Section 32 is described as proof that the building is sound',
    paragraphs: [
      {
        text: 'A Section 32 statement contains important title and property information, but Consumer Affairs Victoria states that it does not include the condition of buildings or whether they comply with building regulations.',
        refs: [4],
      },
      {
        text: 'A Section 32 with nothing alarming in it tells you nothing about the extensions, wet areas, drainage or structural repairs. You still need an inspection.',
      },
    ],
  },
  {
    number: '14',
    title: 'The house has obvious additions but the permit history does not match',
    paragraphs: [
      {
        text: 'Look closely at rear extensions, decks, verandahs, converted garages, internal wall removal, bathrooms and large outbuildings. Consumer Affairs Victoria recommends checking the Section 32 and contacting the local council about planning and building permits. It also warns that illegal alterations may become the buyer’s responsibility after signing.',
        refs: [3, 6],
      },
      {
        text: 'If recent work was completed by an owner-builder and the property is being sold within six years and six months of completion, additional report and insurance obligations may apply. Consumer Affairs Victoria says the defects inspection report must be no more than six months old, and domestic building insurance is required for work above the stated value threshold.',
        refs: [7],
      },
    ],
  },
  {
    number: '15',
    title: 'Owners corporation information is old or incomplete',
    paragraphs: [
      {
        text: 'For a unit, apartment or townhouse, the private lot may look fine while the owners corporation is dealing with water ingress, cladding, roofing, balconies, litigation or a special levy.',
      },
      {
        text: 'Consumer Affairs Victoria notes that an owners corporation certificate covers items such as special fees or levies, repairs that may incur additional charges, outstanding notices or orders and legal proceedings. It also notes that Section 32 statements are sometimes prepared up to 12 months before the sale, and suggests asking for a new certificate or inspecting the register and records.',
        refs: [8],
      },
    ],
  },
]

const warningSigns = [
  {
    sign: 'Floors that slope or bounce',
    meaning: 'Deteriorated or moving stumps, supports or subfloor conditions',
  },
  {
    sign: 'Large wall cracks or distorted openings',
    meaning: 'Building movement, settlement or a need for structural assessment',
  },
  {
    sign: 'Damp brickwork or salt deposits',
    meaning: 'Rising damp, salt damp or prolonged moisture exposure',
  },
  {
    sign: 'Mould, lifting tiles, peeling paint or water pooling in wet areas',
    meaning: 'Leakage, waterproofing failure, poor falls or inadequate ventilation',
  },
  {
    sign: 'Blistering or bubbling paint',
    meaning: 'Moisture or possible concealed timber-pest activity',
  },
  {
    sign: 'Fretting or falling mortar',
    meaning: 'Long-term deterioration and, in some cases, more significant masonry problems',
  },
  {
    sign: 'A sagging roof or broken and displaced tiles',
    meaning: 'Roof-frame movement, failed coverings, leakage and potentially expensive repairs',
  },
  {
    sign: 'Fresh finishes concentrated around cracks or damp areas',
    meaning:
      'Worth a closer look and a moisture test; fresh paint on its own does not mean anything is being hidden',
  },
]

const checklist = [
  'Obtain the complete contract and Section 32 early.',
  'Check whether the Building Report and Pest Report boxes are selected.',
  'Read every special condition, not only GC21 and GC22.',
  'Identify the exact defect phrase used by the contract.',
  'Confirm who is qualified to prepare the report.',
  'Calculate the inspection and notice deadlines.',
  'Confirm what documents and notices must be served, on whom and by what time.',
  'Give the relevant clause to the inspector before the inspection.',
  'Choose and engage the inspector independently.',
  'Ask for access to the roof space, subfloor, garage, outbuildings and other normally inspectable areas.',
  'Check council records where the property has been extended or altered.',
  'Check owner-builder reports and insurance where recent owner-builder work is involved.',
  'For strata property, review a current owners corporation certificate, minutes and records.',
  'Complete inspections before an auction, because the successful bidder cannot make the contract subject to further conditions unless the seller agrees.',
  'Send the completed report to the buyer’s legal adviser immediately if the contract deadline is running.',
]

const faqs = [
  {
    question: 'Can I end a Victorian property contract if the report finds a major defect?',
    answer:
      'Not automatically. The answer depends on the signed contract, whether the relevant condition applies, the wording and severity of the reported defect, the report author’s qualification, the deadline, notice requirements and whether the purchaser has complied with the other relevant obligations. Obtain urgent advice from the buyer’s lawyer or conveyancer.',
  },
  {
    question: 'Is a major building defect the same as a major structural defect?',
    answer:
      'Not necessarily. “Major structural defect” may cover fewer problems, but it depends on the contract and the evidence. Ask your conveyancer about the wording before you sign.',
  },
  {
    question: 'Does the report have to use the exact words “major structural defect”?',
    answer:
      'It depends on the clause. In Willis v Crosland, the Court accepted that a report under the standard-form clause did not need the exact phrase “major building defect” when the report as a whole identified major defects. A custom clause may expressly demand particular words.',
  },
  {
    question: 'Can the inspector tell me whether I can terminate the contract?',
    answer:
      'The inspector can explain the observed defect, its apparent significance, inspection limitations and recommended further investigation. Whether the report activates a contractual termination right is legal advice for the buyer’s lawyer or conveyancer.',
  },
  {
    question: 'Does a Section 32 disclose building defects or illegal building work?',
    answer:
      'No. Consumer Affairs Victoria states that the Section 32 does not include information about the condition of buildings or whether they comply with building regulations. If the house has been renovated, check the permits and plans with the council.',
  },
  {
    question: 'Can I rely on a report supplied by the seller or agent?',
    answer:
      'Check who commissioned it, whether it is current, the inspection scope, inaccessible areas, the report terms and whether the inspector accepts the later buyer as a client. Consumer Affairs Victoria recommends getting your own report.',
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
      datePublished: guide.datePublished,
      dateModified: guide.dateModified,
      inLanguage: 'en-AU',
      articleSection: 'Contracts and pre-purchase inspections',
      author: { '@id': `${SITE_URL}/credentials#inspector` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      mainEntityOfPage: { '@id': `${SITE_URL}${guide.path}` },
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: [
        { '@type': 'Thing', name: 'Pre-purchase building inspection' },
        { '@type': 'Thing', name: 'Contract of sale building report condition' },
        { '@type': 'Place', name: 'Victoria, Australia' },
      ],
      citation: sources.filter((source) => source.href).map((source) => source.href),
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

function SourceRefs({ refs }: { refs?: readonly number[] }) {
  if (!refs || refs.length === 0) return null

  return (
    <>
      {refs.map((ref) => (
        <a
          className="source-ref"
          href={`#source-${ref}`}
          aria-label={`See source ${ref}`}
          key={ref}
        >
          {ref}
        </a>
      ))}
    </>
  )
}

function RedFlagList({ flags }: { flags: readonly RedFlag[] }) {
  return (
    <div className="pressure-pattern-list">
      {flags.map((flag) => (
        <article className="pressure-pattern" key={flag.number}>
          <span>{flag.number}</span>
          <div>
            <p className="pressure-label">Red flag</p>
            <h3>{flag.title}</h3>
            {flag.paragraphs.map((paragraph) => (
              <p key={paragraph.text}>
                {paragraph.text}
                <SourceRefs refs={paragraph.refs} />
              </p>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

export default function MajorBuildingDefectGuide() {
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
              <span aria-current="page">
                Major building defect vs major structural defect
              </span>
            </nav>

            <div className="guide-hero-grid">
              <div>
                <p className="eyebrow">Buyer guide · Contracts and inspections</p>
                <h1>{guide.title}</h1>
                <p className="guide-deck">
                  Many buyers assume a building inspection clause lets them
                  walk away if the report is bad. Whether it does depends on a
                  few words in the contract, so check them before you sign.
                </p>
                <div className="guide-byline">
                  <span>By Xiaoqiong Yang</span>
                  <span>Founder and Building Inspector</span>
                  <span>10 years’ inspection experience</span>
                  <time dateTime={guide.datePublished}>Published {guide.displayDate}</time>
                  <span>{guide.readingTime}</span>
                </div>
              </div>

              <aside className="guide-hero-summary" aria-label="Guide summary">
                <p>In one sentence</p>
                <strong>
                  If the contract says “major structural defect” instead of
                  “major building defect”, you may have fewer ways out when the
                  inspection finds a serious problem.
                </strong>
                <span>
                  Ask your conveyancer to check the inspection clause before
                  you sign.
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
              <a href="#comparison">The two wordings</a>
              <a href="#exact-phrase">Exact-phrase problems</a>
              <a href="#time-and-access">Time, access and attendance</a>
              <a href="#contract-flags">Contract red flags</a>
              <a href="#property-flags">Property red flags</a>
              <a href="#warning-signs">Physical warning signs</a>
              <a href="#checklist">Before signing</a>
              <a href="#questions">Questions</a>
              <a href="#sources">Sources</a>
            </nav>
          </aside>

          <div className="guide-article prose">
            <p className="guide-intro">
              When people inspect an older house, they usually look for cracks,
              damp, a tired roof or termite damage. The contract is easier to
              overlook.
            </p>
            <p>
              It matters, though. A small change in the inspection clause can
              affect whether you are able to end the contract after a bad
              report. “Major building defect” and “major structural defect”
              sound like the same thing, but a contract can treat them
              differently.
            </p>
            <p>
              This guide is about Victorian contracts for established homes. I
              have written it from an inspector’s point of view. It is not legal
              advice. Only a lawyer or conveyancer who has read your contract
              can tell you whether you have a right to end it.
            </p>

            <aside className="practice-callout">
              <p className="eyebrow">About the author</p>
              <p>
                <Link href="/credentials">Xiaoqiong Yang</Link> is the founder
                and working inspector of Home Audit, with 10 years of building
                inspection experience across Melbourne and Victoria. Xiaoqiong
                is registered as a Victorian Building Inspector (Limited),
                registration IN-L 100094, and personally conducts pre-purchase,
                building and pest, moisture, roof and owner-builder inspections.
              </p>
            </aside>

            <section className="guide-short-answer" id="short-answer">
              <p className="eyebrow">The short answer</p>
              <h2>The standard clause already has several conditions, and a special condition can add more.</h2>
              <p>
                In the standard-form General Condition 21, the wording is not
                simply “major defect”. It refers to a{' '}
                <strong>current defect in a structure on the land</strong> that
                the report designates as a <strong>major building defect</strong>.
                The condition operates only if the relevant box in the
                particulars of sale is selected. It also contains requirements
                about the report author, the 14-day period, delivery of the
                report and written notice, and the purchaser not being in
                default.
                <SourceRefs refs={[1, 2]} />
              </p>
              <p>
                Some vendor-prepared contracts add a special condition that
                changes those terms. One contract used for a Victorian sale in
                2026 and reviewed for this guide changed the phrase to{' '}
                <strong>“Major Structural Defect”</strong>, required those exact
                words in the report and reduced the period from 14 days to
                seven.
              </p>
              <p>
                A clause like that is not necessarily invalid, and it does not
                prove the property has a problem. It is still worth asking your
                conveyancer to review it before you sign.
              </p>
            </section>

            <section id="comparison">
              <p className="eyebrow">Side by side</p>
              <h2>How the two wordings compare</h2>
              <div
                className="report-origin-grid"
                aria-label="Standard-form wording compared with a restrictive special condition"
              >
                <article>
                  <span>Standard form</span>
                  <h3>General Condition 21 wording</h3>
                  <ul>
                    {standardWording.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
                <article>
                  <span>Special condition</span>
                  <h3>A restrictive example</h3>
                  <ul>
                    {restrictiveWording.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>
              <p>
                The restrictive example comes from one vendor-prepared
                contract. I have left out the property and the parties, and I
                cannot say how common this wording is.
              </p>
              <p>
                So read the particulars of sale and every special condition as
                well as the general conditions. In that example, the contract
                said the particulars and special conditions took priority over
                the general conditions.
              </p>
            </section>

            <section id="exact-phrase">
              <p className="eyebrow">Why wording matters</p>
              <h2>Why an exact phrase can become a real problem</h2>
              <p>
                In <em>Willis v Crosland</em> [2021] VSCA 320, the report relied
                upon by the buyer did not use the exact expression “major
                building defect”. The Court was satisfied that the report, read
                as a whole, identified major defects sufficiently for the
                standard-form condition used in that matter. The Legal
                Practitioners’ Liability Committee describes the case and warns
                that ending a contract of sale is fraught with risk.
                <SourceRefs refs={[1]} />
              </p>
              <p>
                Wording can still matter. A special condition can say the
                report must contain a particular phrase. In one public forum
                thread, a vendor’s lawyer argued that the buyer’s report did not
                describe the defect in the words the contract required.
                <SourceRefs refs={[9]} />
              </p>
              <p>
                An inspector should not change a finding to help a buyer get out
                of a contract. What helps is giving the inspector the clause
                before the inspection, so the report can describe what was found
                in clear terms. Your lawyer or conveyancer then decides what the
                contract allows and sends any notice.
              </p>
            </section>

            <section id="time-and-access">
              <p className="eyebrow">From practice</p>
              <h2>Why I pay attention to time, access and who actually inspected</h2>
              <p>
                I have spent 10 years working in building inspections in
                Victoria and now operate Home Audit as both founder and working
                inspector.
              </p>
              <p>
                A member of the Home Audit team previously worked as an
                inspector within a Victorian building surveying practice, and
                was routinely expected to complete more than ten new-home
                inspections in a single day. At that volume, there was no
                realistic way to give every property the time and attention most
                owners would assume had been provided. The final inspection
                documentation was also signed by the principal of the practice
                rather than the employee who had physically attended the site.
              </p>
              <p>
                Not every inspection business works that way. But it is why we
                suggest asking a few questions about any report: Who attended?
                How long were they there? What could they get into, and what was
                left out? Did the person who signed the report see the property?
              </p>
              <p>
                The same questions apply when you buy an older home. Older
                houses usually have years of repairs, additions, movement and
                moisture behind them, and some of that work is hidden. An
                inspection that was rushed, or that could not reach large parts
                of the house, will miss things.
              </p>
            </section>

            <section id="red-flags">
              <p className="eyebrow">Fifteen red flags</p>
              <h2>What to check before buying an established Victorian home</h2>
              <p>
                Each of these is a reason to look more closely. None of them
                means the seller is hiding a defect.
              </p>
            </section>

            <section id="contract-flags">
              <h2>Contract wording red flags</h2>
              <RedFlagList flags={contractFlags} />
            </section>

            <section id="property-flags">
              <h2>Property and due-diligence red flags</h2>
              <RedFlagList flags={propertyFlags} />
              <p>
                A report offered through the sales process raises its own
                questions. See{' '}
                <Link href="/guides/agent-pressure-skip-building-inspection">
                  what to do when an agent wants you to skip the inspection
                </Link>
                .
              </p>
            </section>

            <section id="warning-signs">
              <p className="eyebrow">In the house itself</p>
              <h2>Physical warning signs in an older home</h2>
              <p>
                These are things you can see yourself at an open home. Any of
                them is worth having checked properly, though none of them tells
                you on its own what the cause is.
              </p>
              <div className="scope-grid">
                {warningSigns.map((item) => (
                  <div className="scope-item" key={item.sign}>
                    <strong>{item.sign}</strong>
                    <span>{item.meaning}</span>
                  </div>
                ))}
              </div>
              <p>
                Consumer Affairs Victoria lists sloping or bouncy floors, damp
                brick walls, blistering paint, cracked walls, wet-area moisture,
                fretting mortar and a sagging roof among the signs buyers should
                look for, and suggests considering professional building and
                pest inspections before signing.
                <SourceRefs refs={[3]} />{' '}
                A{' '}
                <Link href="/pre-purchase-building-inspection">
                  pre-purchase building inspection
                </Link>{' '}
                records what is visible and what could not be accessed.
              </p>
            </section>

            <section id="checklist">
              <p className="eyebrow">A working list</p>
              <h2>What to check before signing</h2>
              <p>
                Go through this list with your inspector and your legal
                adviser.
              </p>
              <ol>
                {checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
              <p>
                The auction point reflects Consumer Affairs Victoria’s guidance
                that there is no cooling-off period for a successful bidder.
                <SourceRefs refs={[5]} />{' '}
                The inspector reports on the building. The lawyer or conveyancer
                advises on the contract and handles any notice.
              </p>
            </section>

            <section className="guide-faq" id="questions" aria-labelledby="guide-faq-heading">
              <p className="eyebrow">Frequently asked questions</p>
              <h2 id="guide-faq-heading">Inspection clauses and termination</h2>
              <div className="faq-list">
                {faqs.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <section>
              <p className="eyebrow">The real lesson</p>
              <h2>Check the contract before the inspection, if you can</h2>
              <p>
                Once a report shows a serious defect, you may have only a few
                days, sometimes less, to work out what the contract lets you
                do.
              </p>
              <p>
                It is much easier to deal with this earlier. Have the contract
                reviewed before you sign. Check that your inspector’s
                registration matches what the contract asks for before you book.
                Ask the agent for access to the roof space and subfloor before
                the inspection day.
              </p>
              <p>
                The inspection tells you about the condition of the house. What
                you can do about it depends on your contract.
              </p>
            </section>

            <section className="guide-sources" id="sources" aria-labelledby="guide-sources-heading">
              <p className="eyebrow">Sources</p>
              <h2 id="guide-sources-heading">Legal, government and contract sources</h2>
              <ol>
                {sources.map((source) => (
                  <li id={source.id} key={source.id}>
                    {source.href ? (
                      <a href={source.href}>{source.label}</a>
                    ) : (
                      source.label
                    )}
                  </li>
                ))}
                <li id={publicExample.id}>
                  <a href={publicExample.href}>{publicExample.label}</a>. An
                  anecdotal example only; it is not legal authority.
                </li>
              </ol>
              <p>
                Sources were checked on 6 October 2026. The vendor-prepared
                contract used as the restrictive example is not linked or
                reproduced because it identifies a property and the parties to a
                sale.
              </p>
              <p>
                <strong>General information only.</strong> This guide provides
                general information for Victorian property buyers. It is not
                legal advice and does not allege that any seller, agent,
                conveyancer or inspector has acted improperly. Contract wording
                and termination rights should be reviewed by an appropriately
                qualified lawyer or conveyancer. Building observations are
                limited to the inspection scope, safe access and conditions
                present at the time.
              </p>
            </section>

            <aside className="guide-cta">
              <p className="eyebrow">Buying an established home in Melbourne or the Mornington Peninsula?</p>
              <h2>Book an independent inspection before your deadline.</h2>
              <p>
                Home Audit provides independent pre-purchase inspections and{' '}
                <Link href="/building-and-pest-inspections">
                  building and pest inspections for established homes
                </Link>
                . More buyer guidance is in our{' '}
                <Link href="/guides">guides</Link>.
              </p>
              <div className="button-row">
                <Link className="button" href="/quote?service=building-and-pest">
                  Request an existing-home inspection quote
                </Link>
                <Link className="text-link" href="/building-and-pest-inspections">
                  View building and pest inspections <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </main>
  )
}
