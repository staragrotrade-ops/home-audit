import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { PRE_SLAB_GUIDE } from '@/lib/guides'
import { pageMetadata } from '@/lib/metadata'
import { SITE_URL } from '@/lib/site'

const guide = PRE_SLAB_GUIDE

export const metadata = pageMetadata({
  title: 'Pre-Slab Inspection Melbourne: A Glen Waverley Case',
  description: guide.description,
  path: guide.path,
  openGraphType: 'article',
  publishedTime: guide.datePublished,
  modifiedTime: guide.dateModified,
})

const sources = [
  {
    id: 'source-1',
    label:
      'Building and Plumbing Commission — Minimising foundation movement and damage to your house',
    href: 'https://www.bpc.vic.gov.au/resource-hub/safety-guides/minimising-foundation-movement-and-damage-to-your-house',
  },
  {
    id: 'source-2',
    label: 'Standards Australia — AS 2870 Residential slabs and footings',
    href: '',
  },
  {
    id: 'source-3',
    label:
      'Building and Plumbing Commission — Updated plumbing and drainage standards: AS/NZS 3500 series',
    href: 'https://www.bpc.vic.gov.au/plumbers/delivering-safe-and-compliant-plumbing/updated-plumbing-and-drainage-standards-asnzs-3500-series',
  },
  {
    id: 'source-4',
    label:
      'Office of the Technical Regulator (South Australia) — Supporting in-ground sanitary plumbing and drainage pipework (advisory note)',
    href: 'https://www.energymining.sa.gov.au/__data/assets/pdf_file/0010/845065/OTR-PAN-Supporting-in-ground-sanitary-plumbing-and-drainage-pipework.pdf',
  },
  {
    id: 'source-5',
    label: 'Consumer Affairs Victoria — Implied warranties on home building work',
    href: 'https://www.consumer.vic.gov.au/licensing-and-registration/builders-and-tradespeople/running-your-business/warranties-and-insurance/implied-warranties-on-home-building-work',
  },
  {
    id: 'source-6',
    label: 'Consumer Affairs Victoria — Building definitions',
    href: 'https://www.consumer.vic.gov.au/licensing-and-registration/builders-and-tradespeople/building-definitions',
  },
  {
    id: 'source-7',
    label: 'Consumer Affairs Victoria — Building progress',
    href: 'https://www.consumer.vic.gov.au/housing/building-and-renovating/plan-and-manage-your-building-project/building-progress',
  },
  {
    id: 'source-8',
    label:
      'Building and Plumbing Commission — Practice note MI 01: Mandatory notifications and inspections of building work',
    href: 'https://www.bpc.vic.gov.au/resource-hub/practice-notes/mi-01-mandatory-notifications-and-inspections-of-building-work',
  },
]

const caseFacts = [
  {
    title: 'What was visible',
    text: 'Reinforcement sitting too close to a PVC sanitary drainage pipe at a structurally important point, before the concrete pour.',
  },
  {
    title: 'Why it mattered',
    text: 'Steel, concrete and pipe locked together with little room can put load on the pipe when the slab and ground move over time.',
  },
  {
    title: 'When to deal with it',
    text: 'Before the pour, while the bar, the pipe, its support and any lagging can still be seen and adjusted.',
  },
]

const complianceDocuments = [
  'the building permit and endorsed drawings;',
  'the engineer’s design, notes and approved revisions;',
  'the edition of the NCC that applies to the project;',
  'Australian Standards called up by the NCC or the project documents;',
  'plumbing and drainage requirements;',
  'manufacturer installation instructions;',
  'the building contract and specifications;',
  'written directions, approved variations and site-specific engineering advice.',
]

const prePourChecklist = [
  {
    title: 'The stage is ready.',
    text: 'Excavation, formwork or pods, reinforcement, membrane and the relevant services should be far enough along to inspect.',
  },
  {
    title: 'The documents are available.',
    text: 'Give the inspector the structural drawings, slab design, soil report, architectural plans, any revisions and whatever service drawings you have.',
  },
  {
    title: 'Access is arranged.',
    text: 'Agree on notice, induction, PPE and attendance with the builder beforehand.',
  },
  {
    title: 'The work stays uncovered.',
    text: 'Make sure the builder knows an inspection is booked and will not pour or cover the work first.',
  },
  {
    title: 'There is a way to respond to findings.',
    text: 'Ask who will review the report, how disputed items will be answered and whether the engineer or plumber needs to confirm anything in writing.',
  },
  {
    title: 'Fixes are checked.',
    text: 'A promise to fix something is not the same as seeing it fixed. For important items, ask for photos, documents or a reinspection before the pour.',
  },
]

const faqs = [
  {
    question: 'Is reinforcement close to a PVC pipe always a defect?',
    answer:
      'No. A photo or a small-looking gap is not enough on its own. It depends on where the pipe is, whether it passes through a slab, beam or footing, the concrete cover to the steel, how the pipe is supported and lagged, the structural design, the plumbing requirements and the standard edition that applies to the job. A close or touching interface should be checked before the pour, not dismissed or diagnosed from one photo.',
  },
  {
    question: 'If the work follows the approved drawings, is that enough?',
    answer:
      'Not necessarily. Drawings are essential, but domestic building work must also meet the laws and legal requirements that apply to it. The building permit, NCC, Australian Standards, engineering details, plumbing rules, specifications and manufacturer instructions can all be relevant.',
  },
  {
    question: 'Does the mandatory slab inspection replace an independent pre-slab inspection?',
    answer:
      'No. The mandatory inspection is part of the statutory approval process. An independent inspector works for the owner and has a different scope. Neither should be assumed to cover everything the other one looks at.',
  },
  {
    question: 'When should a pre-slab inspection be booked?',
    answer:
      'Once the slab preparation, reinforcement, membrane and services are ready, and before the concrete is poured. Give the builder enough notice to arrange safe access and keep the work uncovered.',
  },
  {
    question: 'Can an independent inspector stop the concrete pour?',
    answer:
      'No. An independent inspector reports to the owner and does not have the powers of the relevant building surveyor. If something important is found, the owner should raise it promptly through the contract and site process and ask for written confirmation of how it will be dealt with. Legal advice may be needed if access, payment or continuation of the work becomes a dispute.',
  },
  {
    question: 'Are older or long-established builders less competent?',
    answer:
      'Not as a rule. Long experience can be valuable. The point is that years in business do not show that one particular detail meets the requirements that apply today. The evidence should settle the technical question.',
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
      articleSection: 'New home construction stage inspections',
      author: { '@id': `${SITE_URL}/credentials#inspector` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      mainEntityOfPage: { '@id': `${SITE_URL}${guide.path}` },
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: [
        { '@type': 'Thing', name: 'Pre-slab inspection' },
        { '@type': 'Thing', name: 'New home construction stage inspection' },
        { '@type': 'Place', name: 'Glen Waverley, Victoria' },
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

function SourceRefs({ refs }: { refs: readonly number[] }) {
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

export default function PreSlabInspectionGuide() {
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
              <span aria-current="page">Pre-slab inspection in Glen Waverley</span>
            </nav>

            <div className="guide-hero-grid">
              <div>
                <p className="eyebrow">New-home case study · Glen Waverley</p>
                <h1>{guide.title}</h1>
                <p className="guide-deck">
                  On a new French Provincial-style house in Glen Waverley, our
                  inspector found a drainage pipe sitting too close to the
                  slab reinforcement. It was found before the concrete pour,
                  which is when it was still easy to fix.
                </p>
                <div className="guide-byline">
                  <span>
                    By <Link href="/credentials">Xiaoqiong Yang</Link>
                  </span>
                  <span>Founder and Building Inspector</span>
                  <span>10 years’ inspection experience</span>
                  <time dateTime={guide.datePublished}>Published {guide.displayDate}</time>
                  <span>{guide.readingTime}</span>
                </div>
              </div>

              <aside className="guide-hero-summary" aria-label="Guide summary">
                <p>In one sentence</p>
                <strong>
                  Approved drawings matter, but a slab also has to meet the
                  structural, plumbing and construction requirements that
                  apply to the project, and the drawings do not spell all of
                  those out.
                </strong>
                <span>
                  Some details have been left out to protect the client and the
                  site.
                </span>
              </aside>
            </div>
          </div>
        </header>

        <div className="container guide-layout">
          <aside className="guide-toc" aria-label="On this page">
            <p>On this page</p>
            <nav>
              <a href="#what-we-saw">What we saw</a>
              <a href="#movement">Why it mattered</a>
              <a href="#drawings">Drawings and other rules</a>
              <a href="#experience">Years of experience</a>
              <a href="#premium-homes">Premium homes</a>
              <a href="#statutory-inspections">Statutory inspections</a>
              <a href="#before-the-pour">Before the pour</a>
              <a href="#questions">Questions</a>
              <a href="#sources">Sources</a>
            </nav>
          </aside>

          <div className="guide-article prose">
            <div className="scope-grid" aria-label="Case summary">
              {caseFacts.map((fact) => (
                <div className="scope-item" key={fact.title}>
                  <strong>{fact.title}</strong>
                  <span>{fact.text}</span>
                </div>
              ))}
            </div>
            <p>
              <small>
                The correct detail depends on the structural and plumbing design
                and the standards that apply to the particular project.
              </small>
            </p>

            <section id="what-we-saw">
              <h2>What our inspector saw before the pour</h2>
              <p className="guide-intro">
                The client had engaged us for an{' '}
                <Link href="/new-home-inspections">
                  independent construction-stage inspection
                </Link>{' '}
                of a new French Provincial-style house in Glen Waverley. Houses
                like this are common in the area: big façades, detailed
                mouldings and high ceilings.
              </p>
              <p>
                At slab stage none of that tells you whether the hidden work is
                right. The reinforcement, membrane and under-slab services were
                still exposed. At one point, the reinforcing steel was too close
                to a PVC sanitary drainage pipe where it mattered structurally.
                There was not enough room for our inspector to be satisfied that
                the pipe had the separation, protection and allowance for
                movement that the detail needed.
              </p>
              <p>Our inspector raised it before the pour.</p>
              <p>
                The builder said he had been building luxury homes for 30 years,
                had never heard of this problem and had followed the drawings.
                The drawings did not say the steel had to be moved, so he asked
                to be shown the requirement.
              </p>
              <p>
                That was a reasonable request. An inspector should be able to
                explain the basis for any significant finding. Our inspector
                showed him the relevant slab and footing requirements and how
                they work together with the drainage requirements. The answer
                was not on one line of the structural plan. It came from reading
                the structural detail, the relevant Australian Standards and the
                plumbing installation together.
              </p>
            </section>

            <section id="movement">
              <h2>The concern was movement, not an immediate leak</h2>
              <p>
                We were not saying the steel would cut the pipe as soon as the
                concrete set. We were saying the pipe and steel were touching,
                or nearly touching, with very little room for the movement every
                house goes through.
              </p>
              <p>
                Concrete shrinks. Slabs and footings move a little. Changes in
                soil moisture and settlement after building can also move
                foundations. The Building and Plumbing Commission says some
                footing movement is normal, and that foundation movement can be
                caused by soil settling after a house is built.
                <SourceRefs refs={[1]} />
              </p>
              <p>
                Where a pipe runs near or through structural concrete, its
                location, support, protection and room to move all matter. The
                Australian standard for residential slabs and footings deals
                with services passing through beams and footings, and the
                sanitary drainage standard deals with pipes near and through
                structural elements.
                <SourceRefs refs={[2, 3]} /> A South Australian government
                plumbing advisory makes the same general point: pipework must be
                protected from mechanical damage, properly supported and kept
                out of structural concrete unless the structural design allows
                for it.
                <SourceRefs refs={[4]} />
              </p>
              <p>
                If steel, concrete and PVC are locked together in the wrong
                place, later movement can put concentrated load on the pipe.
                That does not mean it will fail. It is a risk that costs little
                to check before the pour and a lot to reach afterwards.
              </p>
              <p>
                If a drain under a finished house cracks or distorts, the people
                living there may not see where the problem is coming from.
                Finding and fixing it can mean lifting floors and saw-cutting the
                slab. Before the pour, the builder, plumber and engineer can sort
                out the same detail while everything is still exposed.
              </p>
            </section>

            <section id="drawings">
              <h2>The drawings are not the only rules that apply</h2>
              <p>
                “It is not on the drawing” sounds convincing, because builders
                are expected to follow the approved plans. They are. But
                Victorian domestic building work is not governed by drawings
                alone. Consumer Affairs Victoria explains that the implied
                warranties require work to follow the plans and specifications
                in the contract and also to comply with all laws and legal
                requirements.
                <SourceRefs refs={[5]} />
              </p>
              <p>For a house, the full set of requirements can include:</p>
              <ul>
                {complianceDocuments.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>
                No drawing set can repeat every rule from every trade standard.
                A structural drawing may show where the steel goes and a plumbing
                layout may show where the drain goes. Problems tend to appear
                where the two meet, which is why someone needs to look at the
                work itself.
              </p>
            </section>

            <section id="experience">
              <h2>Thirty years is a long time, but it may not be many houses</h2>
              <p>
                The builder told us he had been building for 30 years. He also
                said he usually finished about one of these houses a year. That
                is roughly 30 houses.
              </p>
              <p>
                Thirty houses is real experience. But “30 years” can sound like
                much more work than it is. Years in the industry, number of
                projects, variety of sites and how often someone has been
                corrected are different things.
              </p>
              <p>
                Experience only improves the work when the builder hears about
                problems. If owners assume an expensive builder does not need an
                independent inspection, a detail like this may never be
                questioned. If a hidden pipe starts leaking years later, the
                builder may never find out.
              </p>
              <p>
                An error does not become correct because it has been repeated
                for 30 years.
              </p>
              <p>
                Codes and standards also change. A better question than “How
                long have you been building?” is “Which requirement applies to
                this detail on this project, and what shows the work meets it?”
              </p>
            </section>

            <section id="premium-homes">
              <h2>Premium homes still need inspecting</h2>
              <p>
                “Luxury” describes the price and the finishes. It says nothing
                about whether the slab is right. Buyers can see stone, joinery
                and high ceilings, but nobody can see the under-slab drainage
                once the concrete is poured.
              </p>
              <p>
                A large custom home can actually have more to coordinate: more
                service penetrations, more wet areas, more structural changes
                and more details that are not in a standard display-home design.
                An independent inspection does not assume the builder is bad. It
                checks the work on this site before it is covered.
              </p>
            </section>

            <section id="statutory-inspections">
              <h2>What the mandatory inspection does and does not tell you</h2>
              <p>
                A member of the Home Audit team previously worked as an
                inspector within a Victorian building surveying practice, and
                was routinely expected to complete more than ten new-home
                inspections in a single day. Travel, access, photos, document
                checks and reports all had to fit into that day. The employee
                attended the sites, and the principal of the practice signed the
                inspection documents.
              </p>
              <p>
                Not every building surveying practice works that way, and
                mandatory inspections have an important role. But a signature
                does not tell an owner how long was spent on site, what was
                checked, what could not be seen, or whether the person who
                signed ever saw the slab.
              </p>
              <p>
                Consumer Affairs Victoria makes a similar distinction: building
                surveyors inspect for compliance with the Building Act and
                building regulations, but do not supervise the work or check it
                against the building contract. It also says owners can engage an
                independent building consultant before making stage payments.
                <SourceRefs refs={[6, 7]} />
              </p>
              <p>
                The Building and Plumbing Commission’s practice note on
                mandatory inspections says such an inspection should check the
                work against the Act, regulations and permit up to that stage,
                not just one element, and that the relevant building surveyor
                stays responsible when someone else inspects for them.
                <SourceRefs refs={[8]} />
              </p>
              <p>
                The two inspections do different jobs, and one does not replace
                the other. For the arguments owners often hear against an
                independent inspection, see{' '}
                <Link href="/guides/independent-new-home-stage-inspections">
                  what builders may tell owners about independent stage
                  inspections
                </Link>
                .
              </p>
            </section>

            <section id="before-the-pour">
              <h2>What to arrange before a slab pour</h2>
              <p>
                A pre-slab inspection needs time to happen. It cannot be done
                once the concrete truck has arrived or the steel and services
                are covered. Before the pour, check that:
              </p>
              <ol>
                {prePourChecklist.map((item) => (
                  <li key={item.title}>
                    <strong>{item.title}</strong> {item.text}
                  </li>
                ))}
              </ol>
              <p>
                An independent inspector does not redesign the slab, certify
                the plumbing or replace the building surveyor, engineer, plumber
                or builder. The inspector records what can be seen, explains any
                concern and says when the right practitioner needs to confirm or
                correct a detail.
              </p>
            </section>

            <section>
              <h2>Check the slab before it disappears</h2>
              <p>
                What made this inspection useful was the timing. The pipe and
                steel were still visible, the builder could ask for the
                requirement, our inspector could show it, and the detail could
                be sorted out before the concrete went in.
              </p>
              <p>
                Years in business, an expensive contract and approved drawings
                all count for something. They are not a substitute for looking
                at what has been built.
              </p>
            </section>

            <section className="guide-faq" id="questions" aria-labelledby="guide-faq-heading">
              <p className="eyebrow">Frequently asked questions</p>
              <h2 id="guide-faq-heading">Pre-slab inspections</h2>
              <div className="faq-list">
                {faqs.map((faq) => (
                  <details key={faq.question}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <aside className="practice-callout">
              <p className="eyebrow">About the author</p>
              <p>
                <Link href="/credentials">Xiaoqiong Yang</Link> is the founder
                and working inspector of Home Audit, with 10 years of building
                inspection experience across Melbourne and Victoria. Xiaoqiong
                is registered as a Victorian Building Inspector (Limited),
                IN-L 100094.
              </p>
            </aside>

            <section className="guide-sources" id="sources" aria-labelledby="guide-sources-heading">
              <p className="eyebrow">Sources</p>
              <h2 id="guide-sources-heading">Sources used for this guide</h2>
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
              </ol>
              <p>
                Sources were checked on 8 October 2026. The South Australian
                advisory note is not Victorian law; it is cited because it
                explains the same general principle. Australian Standards are
                paraphrased, not quoted.
              </p>
              <p>
                This guide provides general information for Victorian
                homeowners. It is not structural engineering, plumbing or legal
                advice, and it cannot decide whether work on another site
                complies. Each project has to be assessed against its approved
                documents, site conditions and the NCC and Australian Standards
                editions that apply to it.
              </p>
            </section>

            <aside className="guide-cta">
              <p className="eyebrow">Building in Melbourne?</p>
              <h2>Have the slab checked before the concrete covers it.</h2>
              <p>
                Home Audit provides independent stage inspections for slab,
                frame, pre-plaster, fixing and practical completion, with clear
                findings and scope limitations.
              </p>
              <div className="button-row">
                <Link className="button" href="/new-home-inspections">
                  View new-home inspection options
                </Link>
                <Link className="text-link" href="/quote?service=new-home">
                  Request a construction-stage quote <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </main>
  )
}
