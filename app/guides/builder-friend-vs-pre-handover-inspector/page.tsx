import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { BUILDER_FRIEND_GUIDE } from '@/lib/guides'
import { pageMetadata } from '@/lib/metadata'
import { SITE_URL } from '@/lib/site'

const guide = BUILDER_FRIEND_GUIDE

export const metadata = pageMetadata({
  title: 'Builder Friend vs Building Inspector Before Handover',
  description: guide.description,
  path: guide.path,
  openGraphType: 'article',
  publishedTime: guide.datePublished,
  modifiedTime: guide.dateModified,
})

const sources = [
  {
    id: 'source-1',
    label: 'Consumer Affairs Victoria — Building progress (including “When building work is complete”)',
    href: 'https://www.consumer.vic.gov.au/housing/building-and-renovating/plan-and-manage-your-building-project/building-progress',
  },
  {
    id: 'source-2',
    label: 'Building and Plumbing Commission — Issues, complaints and disputes',
    href: 'https://www.bpc.vic.gov.au/issues-complaints-and-disputes',
  },
  {
    id: 'source-3',
    label: 'Consumer Affairs Victoria — Implied warranties on home building work',
    href: 'https://www.consumer.vic.gov.au/licensing-and-registration/builders-and-tradespeople/running-your-business/warranties-and-insurance/implied-warranties-on-home-building-work',
  },
]

const reportContents = [
  'what could be seen on the inspection day;',
  'where each item is;',
  'photos, and measurements where they were taken;',
  'the requirement the item was checked against, where that can reasonably be established; and',
  'whether it needs fixing or a specialist should look at it.',
]

const typicalFindings = [
  'poor falls and surface drainage;',
  'signs of moisture getting in, or questionable waterproofing details;',
  'roof flashing, gutter or downpipe problems;',
  'support or structural connections that look wrong;',
  'stair, balustrade and handrail defects;',
  'windows and doors that are badly installed;',
  'unfinished or poor-quality finishes; and',
  'work that does not seem to match the plans or specifications.',
]

const beforeBooking = [
  'their registration or qualifications, where relevant;',
  'how many new-home inspections they have done;',
  'their insurance;',
  'a sample report; and',
  'what the inspection does not cover.',
]

const faqs = [
  {
    question: 'Can a builder inspect another builder’s work?',
    answer:
      'Yes. An experienced builder can spot problems and give useful advice. What matters is whether they are doing a properly scoped inspection and writing a clear, dated report, or just walking through with you.',
  },
  {
    question: 'Can a building inspection report be used at VCAT?',
    answer:
      'It may be relevant in a building dispute, but whether and how it can be used depends on the case and any directions about evidence. A routine pre-handover report is not automatically an expert witness report. Get advice on your own case if it comes to that.',
  },
  {
    question: 'Is a pre-handover inspection worth it if my builder has already fixed defects?',
    answer:
      'It can be. A builder who fixes what has been raised is a good sign, but an independent inspection may find things nobody has raised yet and records the condition of the house before you move in.',
  },
  {
    question: 'Does a building inspector know more than a builder?',
    answer:
      'Not necessarily. The two jobs overlap but are different. Look for real inspection experience, knowledge of the building requirements, a consistent method and reports that explain findings clearly.',
  },
  {
    question: 'Will a pre-handover inspection find every defect?',
    answer:
      'No. Most are visual and non-invasive, so hidden problems cannot be guaranteed to show up. A good report says what was inspected, what could not be reached and what the limits were.',
  },
]

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
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
      articleSection: 'New home and pre-handover inspections',
      author: { '@id': `${SITE_URL}/credentials#inspector` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      mainEntityOfPage: { '@id': `${SITE_URL}${guide.path}` },
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: [
        { '@type': 'Thing', name: 'Pre-handover inspection' },
        { '@type': 'Thing', name: 'Practical completion inspection' },
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

function SourceRef({ n }: { n: number }) {
  return (
    <a className="source-ref" href={`#source-${n}`} aria-label={`See source ${n}`}>
      {n}
    </a>
  )
}

export default function BuilderFriendGuide() {
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
              <span aria-current="page">Builder friend or inspector?</span>
            </nav>

            <div className="guide-hero-grid">
              <div>
                <p className="eyebrow">New-home guide · Before handover</p>
                <h1>{guide.title}</h1>
                <p className="guide-deck">
                  Your builder has been fixing things as you go, and you have a
                  friend who is a builder. Is it still worth paying for an
                  independent inspection before handover?
                </p>
                <div className="guide-byline">
                  <span>
                    By <Link href="/credentials">Xiaoqiong Yang</Link>
                  </span>
                  <span>Founder and Building Inspector</span>
                  <time dateTime={guide.datePublished}>Published {guide.displayDate}</time>
                  <span>{guide.readingTime}</span>
                </div>
              </div>

              <aside className="guide-hero-summary" aria-label="Guide summary">
                <p>In short</p>
                <strong>
                  A builder friend can spot problems. An inspection also gives
                  you a dated, written record of what was found.
                </strong>
                <span>
                  Many owners do both: bring the friend along and book an
                  inspection.
                </span>
              </aside>
            </div>
          </div>
        </header>

        <div className="container guide-layout">
          <aside className="guide-toc" aria-label="On this page">
            <p>On this page</p>
            <nav>
              <a href="#written-record">A written record</a>
              <a href="#disputes">If there is a dispute later</a>
              <a href="#skills">Building and inspecting</a>
              <a href="#method">A set method</a>
              <a href="#accountability">Who is responsible</a>
              <a href="#tracking">Tracking repairs</a>
              <a href="#timing">Before you move in</a>
              <a href="#responsive-builder">If your builder is responsive</a>
              <a href="#questions">Questions</a>
              <a href="#sources">Sources</a>
            </nav>
          </aside>

          <div className="guide-article prose">
            <p className="guide-intro">
              After spending hundreds of thousands of dollars on a new home, one
              more inspection fee can feel unnecessary, especially if the
              builder has dealt with problems quickly.
            </p>
            <p>
              A knowledgeable friend walking through the house is useful. It is
              not the same as an independent inspector checking the house
              against an agreed scope and writing down what they find. The
              difference is partly about who notices what, but mostly about how
              problems are recorded and followed up, which matters if there is a
              disagreement later.
            </p>

            <section id="written-record">
              <h2>Will you have a written record?</h2>
              <p>
                Say your friend notices poor drainage outside a door, or a
                balcony detail that does not look right. They mention it, and
                you pass it on to the builder.
              </p>
              <p>
                Six months later it still has not been fixed, and nobody agrees
                on whether it was there at handover, what was said or whether a
                repair was promised. Without anything in writing, that
                conversation is hard to reconstruct.
              </p>
              <p>An inspection report usually records:</p>
              <ul>
                {reportContents.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>
                An experienced builder can write a report too. But a favour from
                a friend is usually a walk-through, not a systematic inspection
                with a written result.
              </p>
            </section>

            <section id="disputes">
              <h2>A dated report helps if a defect is disputed</h2>
              <p>
                People can disagree about whether a defect exists, when it
                appeared, what caused it, how big it is and who should fix it.
              </p>
              <p>
                Consumer Affairs Victoria suggests inspecting the house
                thoroughly before you take possession and listing any issues on
                the handover sheet, noting that this may help avoid disputes
                about who is responsible for fixing them.
                <SourceRef n={1} /> If a dispute does arise, the Building and
                Plumbing Commission offers free dispute resolution between
                homeowners and builders, with binding orders or VCAT as further
                steps.
                <SourceRef n={2} />
              </p>
              <p>
                A report written before you move in records the condition of the
                house at that point. Photos, measurements and clear descriptions
                also make your emails to the builder more precise.
              </p>
              <p>
                A report does not win a dispute for you. A standard pre-handover
                report is not the same as an expert witness report prepared for
                a tribunal, and how much weight any document carries depends on
                the case. What people remember can still matter, but a written
                record makes it easier to show what was seen, when, and what was
                raised.
              </p>
            </section>

            <section id="skills">
              <h2>Building a house and inspecting one overlap, but they are different jobs</h2>
              <p>
                A builder knows materials, trades, sequencing and workmanship,
                and that knowledge is valuable.
              </p>
              <p>
                An inspector’s job is to look at finished or part-finished work
                critically, using a consistent method, and to check it against
                the relevant requirements where needed. Those can include the
                National Construction Code, Australian Standards, the approved
                plans and the contract specifications.
              </p>
              <p>
                Nobody remembers every requirement. Part of the job is knowing
                when to look something up, telling a defect apart from a matter
                of taste, and knowing when to send a question to a specialist.
              </p>
              <p>
                A builder who mainly does framing may be excellent at timber
                construction but see less waterproofing or drainage detail day
                to day. Inspectors vary too. Years in the industry do not, on
                their own, show that every detail has been checked against the
                requirements that apply.
              </p>
            </section>

            <section id="method">
              <h2>An inspection follows a set method</h2>
              <p>
                A friend will quickly see a crooked door, a damaged finish or an
                obvious leak. A pre-handover inspector should work through an
                agreed scope and check each accessible part of the house in
                turn, rather than noting whatever stands out.
              </p>
              <p>Things an inspection may pick up include:</p>
              <ul>
                {typicalFindings.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>
                Some items need measurements, testing, reference documents or a
                specialist. Some cannot be confirmed by a visual, non-invasive
                inspection at all.
              </p>
            </section>

            <section id="accountability">
              <h2>Who is responsible for the findings</h2>
              <p>
                When you engage an inspector, the engagement should make clear
                who they are, what they will inspect, what they will report and
                what they are responsible for. Before booking anyone, ask about:
              </p>
              <ul>
                {beforeBooking.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>
                A friend may be honest and helpful, but may not want to, or be
                able to, write a technical reply if the builder disagrees with
                them. Equally, do not assume a paid inspector will act as an
                expert witness later. That is normally a separate engagement.
              </p>
              <p>
                An inspection does not guarantee every finding is right. What it
                gives you is a defined engagement and a written record of what
                was found.
              </p>
            </section>

            <section id="tracking">
              <h2>A written list makes repairs easier to track</h2>
              <p>
                Even with a cooperative builder, defects raised in phone calls
                and on-site chats are hard to keep track of.
              </p>
              <p>
                A report gives each item a location, a description and a photo.
                You can send it to the builder, ask for a written reply and tick
                items off as they are fixed. If something is serious, disputed or
                hard to judge after the repair, a follow-up inspection or a
                specialist may be worth it.
              </p>
              <p>
                It can also keep the relationship friendly: both sides are
                working from the same list instead of different memories.
              </p>
            </section>

            <section id="timing">
              <h2>Before you move in is a good time to record the house</h2>
              <p>
                Before furniture and belongings go in, more of the house can be
                seen and its condition at handover can be recorded.
              </p>
              <p>
                Once you are living there, everyday use, changes and later damage
                can make it harder to show what was there from the start. That
                does not mean the builder stops being responsible for defects
                after handover. The statutory warranties on domestic building
                work and your contract rights can continue.
                <SourceRef n={3} />
              </p>
              <p>
                For what a practical completion inspection covers, see our{' '}
                <Link href="/practical-completion-inspection">
                  practical completion inspection
                </Link>{' '}
                page.
              </p>
            </section>

            <section id="responsive-builder">
              <h2>What if your builder has been good about fixing things?</h2>
              <p>
                That is a good sign. But fixing the defects someone has already
                pointed out is different from finding the ones nobody has
                noticed yet.
              </p>
              <p>
                A cooperative builder, a capable friend and an independent
                inspector can all help with a smooth handover. You do not have
                to choose between them. If you are still at an earlier stage,
                see{' '}
                <Link href="/guides/independent-new-home-stage-inspections">
                  what builders may tell you about independent stage
                  inspections
                </Link>
                .
              </p>
            </section>

            <section>
              <h2>So, the friend or the inspector?</h2>
              <p>
                Consider both. Bring your friend for a practical second opinion,
                and book an independent inspector if you want a systematic check
                and a written report.
              </p>
              <p>
                Read the inspection scope before you book. Most pre-handover
                inspections are visual and non-invasive and cannot find every
                hidden or future defect.
              </p>
              <p>
                The point is not to start an argument with the builder. It is to
                find problems early, put them in writing and make them easier to
                fix while the job is still fresh.
              </p>
            </section>

            <section className="guide-faq" id="questions" aria-labelledby="guide-faq-heading">
              <p className="eyebrow">Frequently asked questions</p>
              <h2 id="guide-faq-heading">Builder friends and pre-handover inspections</h2>
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
              <p className="eyebrow">Sources</p>
              <h2 id="guide-sources-heading">Sources used for this guide</h2>
              <ol>
                {sources.map((source) => (
                  <li id={source.id} key={source.id}>
                    <a href={source.href}>{source.label}</a>
                  </li>
                ))}
              </ol>
              <p>
                Sources were checked on 8 October 2026. This is general
                information, not legal advice. What applies depends on the
                project, the contract, the building approvals and the law. An
                inspection report is limited to its agreed scope.
              </p>
            </section>

            <aside className="guide-cta">
              <p className="eyebrow">Building in Melbourne?</p>
              <h2>Book an independent pre-handover inspection.</h2>
              <p>
                Home Audit provides independent new-home and pre-handover
                inspections across Melbourne, with a written report covering
                what was found and what could not be inspected.
              </p>
              <div className="button-row">
                <Link className="button" href="/new-home-inspections">
                  View new-home inspection options
                </Link>
                <Link className="text-link" href="/quote?service=new-home">
                  Request a quote <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </main>
  )
}
