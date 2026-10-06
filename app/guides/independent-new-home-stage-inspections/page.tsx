import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { NEW_HOME_STAGE_GUIDE } from '@/lib/guides'
import { pageMetadata } from '@/lib/metadata'
import { SITE_URL } from '@/lib/site'

const guide = NEW_HOME_STAGE_GUIDE

export const metadata = pageMetadata({
  title: 'Independent New Home Stage Inspections: Builder Claims Explained',
  description: guide.description,
  path: guide.path,
  openGraphType: 'article',
  publishedTime: guide.datePublished,
  modifiedTime: guide.dateModified,
})

type ClaimBlock = string | readonly string[]

type Claim = {
  number: string
  claim: string
  body: readonly ClaimBlock[]
}

type ClaimGroup = {
  id: string
  title: string
  claims: readonly Claim[]
}

const claimGroups: readonly ClaimGroup[] = [
  {
    id: "before-signing",
    title: "Before signing the building contract",
    claims: [
      {
        number: "01",
        claim: "You don’t need your own inspector. The building surveyor already inspects every stage.",
        body: [
          "This confuses statutory inspection with a detailed private quality inspection.",
          "A statutory inspection may address required regulatory matters at a particular stage. It is not necessarily a room-by-room, item-by-item assessment of workmanship, finishes, specifications and every visible defect.",
          "The two inspections serve different purposes.",
        ],
      },
      {
        number: "02",
        claim: "We have our own independent quality inspector.",
        body: [
          "The important question is not only whether that inspector is qualified.",
          "Ask:",
          ["Who appoints them?", "Who pays them?", "Who receives their report?", "Does the homeowner get the full report?", "Can the homeowner instruct them?", "Are they accountable to the owner if something is missed?"],
          "A consultant working within the builder’s QA process may still provide useful checks, but that does not make them equivalent to a person engaged directly by the homeowner.",
        ],
      },
      {
        number: "03",
        claim: "We are a premium or award-winning builder. Private inspectors are mainly for cheaper builders.",
        body: [
          "Brand reputation cannot inspect one specific house.",
          "Even reputable builders rely on changing site supervisors, trades, subcontractors and suppliers. Workload, scheduling pressure and individual workmanship vary from site to site.",
          "An inspection is about the work that is actually present on your property, not the marketing position of the builder.",
        ],
      },
      {
        number: "04",
        claim: "A final inspection at handover is all you need.",
        body: [
          "By practical completion, many important construction elements are no longer visible.",
          "Depending on the construction system, earlier stage inspections may allow review of items such as:",
          ["slab preparation and visible penetrations;", "framing alignment and connections;", "bracing;", "tie-downs;", "wall wrap and flashing details;", "services before lining;", "waterproofing-related preparation;", "defects that will later be hidden by plaster, cabinetry, cladding or finishes."],
          "A final inspection remains important, but it cannot recreate visibility that existed months earlier.",
        ],
      },
      {
        number: "05",
        claim: "You can decide about an inspector later.",
        body: [
          "This can become expensive if the contract already contains procedures relating to:",
          ["notice for site access;", "inspection windows;", "induction requirements;", "administration charges;", "report-review fees;", "extensions of time;", "restrictions on third-party attendance."],
          "The best time to understand those clauses is before signing, not when a slab pour or plaster installation is already scheduled.",
        ],
      },
      {
        number: "06",
        claim: "Use the inspector or surveyor we recommend. They already know our system.",
        body: [
          "Familiarity can make scheduling easier, but it does not automatically establish independence.",
          "If independence matters to you, you should know who selected the inspector, who pays them and whether there is an ongoing referral relationship with the builder.",
        ],
      },
      {
        number: "07",
        claim: "Another inspector just duplicates work.",
        body: [
          "Only if the scope is the same.",
          "A building surveyor, builder QA inspector, bank valuer and homeowner’s independent inspector have different clients, responsibilities and priorities.",
          "Calling all of them “inspectors” does not make their roles interchangeable.",
        ],
      },
      {
        number: "08",
        claim: "The bank inspects every stage before releasing money.",
        body: [
          "A lender may use inspections or valuations to decide whether construction has progressed sufficiently for the next drawdown.",
          "That protects the lender’s financial position.",
          "It is not a substitute for a defect-focused construction inspection for the owner.",
        ],
      },
    ],
  },
  {
    id: "during-construction",
    title: "During construction",
    claims: [
      {
        number: "09",
        claim: "It is our site until handover. You and your inspector have no right to enter.",
        body: [
          "The builder controls the worksite and has real safety obligations.",
          "That does not mean every refusal of access is automatically reasonable.",
          "The practical issue is usually how access is arranged: notice, PPE, induction, insurance requirements, supervision and safe timing.",
          "A blanket refusal should be treated differently from a genuine request to organise access safely.",
        ],
      },
      {
        number: "10",
        claim: "Our insurance or OH&S policy does not allow third parties on site.",
        body: [
          "Safety requirements can be legitimate.",
          "A professional solution may include:",
          ["White Card requirements;", "evidence of public liability insurance;", "site induction;", "PPE;", "a nominated inspection time;", "attendance with a supervisor or site representative."],
          "“Safety applies” and “no independent inspector can ever attend” are not the same statement.",
        ],
      },
      {
        number: "11",
        claim: "The supervisor must be present, but the supervisor is unavailable.",
        body: [
          "That may be completely reasonable once.",
          "The problem arises if the supervisor is repeatedly unavailable while the work continues to be poured, lined, tiled or covered.",
          "At that point, a scheduling condition can become a practical barrier to inspection.",
          "For key stages, owners should try to establish the inspection process in advance.",
        ],
      },
      {
        number: "12",
        claim: "We can only give you 24 hours’ notice.",
        body: [
          "Short construction windows are real, but very short notice can make independent inspection almost impossible.",
          "If you intend to use stage inspections, agree as early as possible:",
          ["how much notice will be given;", "who will send it;", "what counts as stage completion;", "whether the work will remain visible until the inspection is completed."],
          "The point is not to stop construction indefinitely.",
          "It is to avoid being notified only after the critical inspection window has effectively disappeared.",
        ],
      },
      {
        number: "13",
        claim: "We cannot stop the trades while waiting for your inspector.",
        body: [
          "A builder should not be expected to hold a site indefinitely without reason.",
          "But the opposite extreme — immediately covering work before an agreed inspection can occur — defeats the purpose of the inspection.",
          "Critical stages should be planned rather than improvised.",
        ],
      },
      {
        number: "14",
        claim: "Those items are still works in progress. We’ll fix them later.",
        body: [
          "Sometimes that answer is completely valid.",
          "A stage inspection can happen before every cosmetic item is complete.",
          "The useful follow-up is to make the response specific:",
          ["Which items will be rectified?", "Who will do the work?", "When will it happen?", "Will the item remain visible?", "Will photos be supplied?", "Is a reinspection required before it is covered?"],
          "“We’ll fix it later” is much more useful when it becomes a documented action.",
        ],
      },
      {
        number: "15",
        claim: "They are only minor defects. We’ll deal with them during maintenance.",
        body: [
          "Some defects genuinely can wait.",
          "A paint touch-up is not the same as a framing issue, waterproofing concern, weatherproofing defect, fire-separation issue or item that is about to become permanently concealed.",
          "The classification should follow the nature and consequence of the defect, not simply the convenience of the program.",
        ],
      },
      {
        number: "16",
        claim: "Everything is within tolerance.",
        body: [
          "Ask for the basis of that conclusion.",
          "Useful questions include:",
          ["What was measured?", "What was the result?", "What tolerance is being relied upon?", "Which document or clause applies?", "Is that document actually applicable to this material and stage?"],
          "A conclusion is easier to assess when the measurement and reference are both provided.",
        ],
      },
      {
        number: "17",
        claim: "Our engineer has signed it off.",
        body: [
          "That may resolve the issue — but the details matter.",
          "Ask:",
          ["Which engineer?", "Did they inspect the site in person?", "Were they reviewing this exact defect?", "Did they rely only on photos?", "Is there written advice?", "Was a detail or drawing revised?", "Does the completed work match the engineer’s accepted solution?"],
          "“An engineer is involved” is not the same as having written engineering approval for the exact work in question.",
        ],
      },
      {
        number: "18",
        claim: "It is an approved Performance Solution.",
        body: [
          "A Performance Solution is not simply a phrase used after something has been built differently.",
          "If a non-standard or alternative compliance pathway is being relied upon, ask for the relevant design, assessment and approval documents and confirm that the installed work matches them.",
        ],
      },
      {
        number: "19",
        claim: "Your inspector is too picky. They have to find faults to justify their fee.",
        body: [
          "Inspectors can overreach. Builders can also dismiss valid defects.",
          "The answer is evidence.",
          "For each disputed item, ask what it is being assessed against, such as:",
          ["the building contract;", "specifications;", "approved drawings;", "the NCC;", "an applicable Australian Standard;", "manufacturer installation instructions;", "the current Victorian Guide to Standards and Tolerances;", "engineering documentation."],
          "A useful inspection report should do more than say that something “looks wrong”.",
        ],
      },
      {
        number: "20",
        claim: "Your inspector is not a party to the contract, so we do not have to respond to the report.",
        body: [
          "The inspector generally is not a party to the building contract.",
          "The homeowner is.",
          "The practical approach is for the homeowner to submit or rely on the report in their own name and ask the builder to state whether each material item is:",
          ["accepted;", "rejected;", "already rectified;", "scheduled for rectification; or", "disputed with reasons."],
          "A technical report is evidence. It does not need to become a personal argument between an inspector and a site supervisor.",
        ],
      },
      {
        number: "21",
        claim: "We’ll send you photos. There is no need for an inspection.",
        body: [
          "Photos can be useful evidence, but they show only what the photographer chose to capture.",
          "They may not show:",
          ["the overall location of an item;", "level, plumb or dimensional measurements;", "surrounding construction;", "the reverse side of an element;", "all rooms or all defects;", "whether the photographed work is representative of the whole stage."],
          "Photos can support an inspection. They do not automatically replace one.",
        ],
      },
      {
        number: "22",
        claim: "An independent inspection will damage your relationship with the site supervisor.",
        body: [
          "A professional inspection should focus on the building, not personalities.",
          "Clear reports, sensible references and respectful communication generally reduce conflict rather than create it.",
          "If a builder is confident in its work, an evidence-based inspection should not need to be treated as a personal accusation.",
        ],
      },
    ],
  },
  {
    id: "fees-and-payment",
    title: "Fees, delays and payment pressure",
    claims: [
      {
        number: "23",
        claim: "Every independent inspection automatically adds extra days to the construction period.",
        body: [
          "An inspection can cause a real delay if access, reporting or rectification actually affects the program.",
          "That is different from saying that the mere act of engaging an inspector automatically creates a fixed delay.",
          "Read the contract carefully and ask how any claimed extension of time will be documented.",
        ],
      },
      {
        number: "24",
        claim: "You must pay an administration, induction or report-review fee every time.",
        body: [
          "Some building contracts contain fees or procedures for third-party access.",
          "These can materially change the economics of stage inspections.",
          "That is another reason to review access clauses before signing.",
          "Do not assume a fee is valid or invalid without checking the actual contract and circumstances. If a clause could materially restrict your ability to inspect the work, obtain legal advice before signing.",
        ],
      },
      {
        number: "25",
        claim: "The stage has been certified, so the invoice is due immediately.",
        body: [
          "Progress-payment timing matters.",
          "Owners should not casually withhold payment contrary to the contract, but neither should they assume that a statutory inspection outcome is the same as a private quality review.",
          "If you intend to inspect before paying a stage claim, plan that process before the invoice arrives.",
        ],
      },
      {
        number: "26",
        claim: "Pay now and we’ll deal with the inspection report afterwards.",
        body: [
          "Once the next trade covers the work, inspection and rectification can become much harder.",
          "The key issue is not simply whether money has changed hands.",
          "It is whether the disputed work will remain visible and whether there is a documented plan for resolution.",
        ],
      },
      {
        number: "27",
        claim: "If you don’t pay immediately, you will delay the whole build and be in breach.",
        body: [
          "There can be genuine contractual consequences for non-payment.",
          "That is why owners should avoid making unilateral payment decisions based only on frustration or an inspection report.",
          "At the same time, payment pressure should not be used as a substitute for addressing whether the relevant stage is actually complete.",
          "If the issue is serious or disputed, get contract-specific legal advice.",
        ],
      },
      {
        number: "28",
        claim: "An outside inspector may void your warranty.",
        body: [
          "A non-destructive independent inspection is not the same thing as altering or damaging the building work.",
          "If an inspector causes damage or interferes with the work, that raises a different issue.",
          "A competent inspector should work within the agreed access conditions and avoid destructive testing unless it has been specifically authorised.",
        ],
      },
      {
        number: "29",
        claim: "Home Warranty will cover anything later.",
        body: [
          "Warranty and insurance mechanisms are remedies after problems arise.",
          "They are not a construction-quality-control system.",
          "They do not automatically discover concealed defects, prevent disputes, eliminate rectification delays or remove the disruption caused by defective work.",
          "Prevention and evidence are usually easier while the work is still visible.",
        ],
      },
      {
        number: "30",
        claim: "The Occupancy Permit has been issued, so everything is complete and compliant.",
        body: [
          "This is one of the most important misunderstandings.",
          "An Occupancy Permit is significant, but it should not be treated as a whole-of-house guarantee that every contractual item, finish, defect or compliance issue has been checked and accepted.",
          "The building contract still matters. The approved plans and specifications still matter. Visible defects still matter.",
          "An Occupancy Permit is not a replacement for a detailed practical completion inspection.",
        ],
      },
    ],
  },
]

const faqs = [
  {
    question: "Can a builder refuse an independent building inspector in Victoria?",
    answer:
      "A builder can impose legitimate site-safety and access procedures. Whether a particular refusal is lawful or reasonable depends on the contract, circumstances and the proposed access. Owners should distinguish between reasonable controls — such as induction, PPE, insurance and agreed timing — and a blanket refusal designed to prevent inspection altogether. If access becomes disputed, obtain advice based on the actual building contract.",
  },
  {
    question: "Does the building surveyor check workmanship?",
    answer:
      "A statutory building inspection is not the same thing as a comprehensive private workmanship inspection for the owner. The surveyor has an important regulatory role, but homeowners should not assume that every finish, contractual requirement and workmanship issue has been checked simply because a mandatory stage inspection has occurred.",
  },
  {
    question: "Is a frame inspection worth it?",
    answer:
      "It can be particularly valuable because much of the framing will later be covered by plasterboard, cladding and other finishes. Once concealed, visual inspection becomes far more limited.",
  },
  {
    question: "Is pre-plaster inspection more important than PCI?",
    answer:
      "They serve different purposes. Pre-plaster inspection gives access to work that will soon become hidden. PCI focuses on the completed or nearly completed home. A PCI cannot fully replace the opportunity to inspect concealed-stage work.",
  },
  {
    question: "Can I inspect before paying a progress claim?",
    answer:
      "Owners should check the construction contract, notice requirements and payment terms. In Victoria, independent inspection before progress payments is recognised as part of prudent owner oversight, but homeowners should not simply withhold payment without understanding their contractual obligations. If there is a serious dispute, obtain legal advice.",
  },
  {
    question: "Does an Occupancy Permit mean the house has no defects?",
    answer:
      "No. An Occupancy Permit does not mean that every item in the building contract has been checked, every finish is defect-free, or every workmanship issue has been resolved. A practical completion inspection serves a different purpose.",
  },
  {
    question: "Will an independent inspector delay my build?",
    answer:
      "It can if access, reporting or rectification actually affects the construction program. Good planning reduces that risk. The best approach is to agree on notice, access and inspection timing before each stage rather than trying to arrange an inspector after the work is already being covered.",
  },
  {
    question: "Do I need every stage inspected?",
    answer:
      "Not every owner chooses every stage. The decision depends on budget, risk, construction type and how much independent evidence the owner wants before work becomes concealed. If only limited inspections are possible, discuss the construction program and prioritise stages where important work is about to disappear from view.",
  },
]

const sources = [
  {
    id: 'source-1',
    label:
      'Consumer Affairs Victoria — Building progress (site access, independent consultants and stage payments)',
    href: 'https://www.consumer.vic.gov.au/housing/building-and-renovating/plan-and-manage-your-building-project/building-progress',
  },
  {
    id: 'source-2',
    label: 'Consumer Affairs Victoria — Implied warranties on home building work',
    href: 'https://www.consumer.vic.gov.au/licensing-and-registration/builders-and-tradespeople/running-your-business/warranties-and-insurance/implied-warranties-on-home-building-work',
  },
  {
    id: 'source-3',
    label: 'Consumer Affairs Victoria — Property definitions',
    href: 'https://www.consumer.vic.gov.au/housing/buying-and-selling-property/definitions',
  },
  {
    id: 'source-4',
    label: 'Building and Plumbing Commission — Guide to Standards and Tolerances 2026',
    href: 'https://www.bpc.vic.gov.au/resource-hub/guides/guide-to-standards-and-tolerances-2026',
  },
]

const roles = [
  {
    title: 'Building surveyor',
    text: 'A building surveyor or relevant building surveyor performs statutory functions under the building regulatory system. The purpose is not to act as the homeowner’s private quality-control consultant or to check every workmanship issue against the building contract.',
  },
  {
    title: 'Builder or internal QA inspector',
    text: 'A builder may have supervisors, internal quality staff or external consultants. Those checks can be useful, but they remain part of the builder’s own delivery and quality process. They are not the same as an inspection commissioned by the owner.',
  },
  {
    title: 'Bank valuer or progress inspector',
    text: 'A lender may inspect or value construction progress before releasing funds. The lender’s interest is primarily whether the claimed construction stage and security position support further lending. That is not a detailed workmanship inspection for the homeowner.',
  },
  {
    title: 'Independent building inspector',
    text: 'An independent stage inspector is directly engaged by the homeowner. The inspector can review visible work at key stages, compare what is built with relevant plans, specifications and technical requirements, document defects before they are covered, and give the homeowner their own evidence.',
  },
]

const stages = [
  {
    title: 'Slab / base stage',
    text: 'Useful because later work can hide important details around the slab, penetrations, set-out and early construction.',
  },
  {
    title: 'Frame stage',
    text: 'A major opportunity to review visible framing before wall linings conceal connections and structural elements.',
  },
  {
    title: 'Pre-plaster stage',
    text: 'Often one of the last opportunities to inspect many internal construction details before plasterboard closes the walls and ceilings.',
  },
  {
    title: 'Fixing stage',
    text: 'Useful for reviewing workmanship, fit-off and visible progress before the home reaches final completion.',
  },
  {
    title: 'Practical completion / PCI',
    text: 'A detailed pre-handover inspection of visible defects, incomplete work, finishes and other issues that should be documented before handover.',
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
      articleSection: 'New home construction stage inspections',
      author: { '@id': `${SITE_URL}/credentials#inspector` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      mainEntityOfPage: { '@id': `${SITE_URL}${guide.path}` },
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: [
        { '@type': 'Thing', name: 'New home construction stage inspection' },
        { '@type': 'Thing', name: 'Independent building inspection' },
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

export default function IndependentNewHomeStageInspectionsGuide() {
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
              <span aria-current="page">Independent stage inspections</span>
            </nav>

            <div className="guide-hero-grid">
              <div>
                <p className="eyebrow">New-home guide · Building in Victoria</p>
                <h1>{guide.title}</h1>
                <p className="guide-deck">
                  The discouragement rarely sounds like a refusal. It usually
                  sounds reasonable—which is why it works.
                </p>
                <div className="guide-byline">
                  <span>By Xiaoqiong Yang</span>
                  <time dateTime={guide.datePublished}>Published {guide.displayDate}</time>
                  <span>{guide.readingTime}</span>
                </div>
                <p className="guide-reviewer">
                  Written by{' '}
                  <Link href="/credentials">
                    Xiaoqiong Yang, Building Inspector (Limited), IN-L 100094
                  </Link>
                  .
                </p>
              </div>

              <aside className="guide-hero-summary" aria-label="Guide summary">
                <p>In one sentence</p>
                <strong>
                  The builder, site manager, building surveyor and bank all have
                  roles in the build—but none of them is engaged solely to
                  protect the homeowner.
                </strong>
                <span>
                  That is the role an independent inspector is intended to fill.
                </span>
              </aside>
            </div>
          </div>
        </header>

        <div className="container guide-layout">
          <aside className="guide-toc" aria-label="On this page">
            <p>On this page</p>
            <nav>
              <a href="#statutory-inspections">Statutory inspections</a>
              <a href="#four-roles">Four roles people confuse</a>
              <a href="#before-signing">Before signing</a>
              <a href="#during-construction">During construction</a>
              <a href="#fees-and-payment">Fees and payment</a>
              <a href="#what-to-do">What owners should do</a>
              <a href="#stages">Which stages to inspect</a>
              <a href="#questions">Questions</a>
              <a href="#sources">Sources</a>
            </nav>
          </aside>

          <div className="guide-article prose">
            <p className="guide-intro">
              When a homeowner asks to bring an independent inspector onto a
              new-build site, the answer is not always a simple “no”. More
              often, the discouragement sounds reasonable.
            </p>
            <p>
              You may be told that the building surveyor already checks every
              stage. You may hear that the builder has its own quality team,
              that the site is too dangerous for third parties, that an
              inspection will delay the job, or that the Occupancy Permit proves
              the home is compliant.
            </p>
            <p>
              Some of those statements contain a piece of truth. That is exactly
              why they can be persuasive.
            </p>
            <p>
              The most effective pressure tactics are rarely complete lies. They
              usually take one true fact—site safety, statutory inspections,
              payment deadlines, contractual procedures or possible delays—and
              stretch it into a reason why the owner should give up independent
              scrutiny.
            </p>
            <p>
              In Victoria, owners can engage an independent building consultant
              to check work before making stage payments, and have a right of
              reasonable access to the building site during construction.
              <a className="source-ref" href="#source-1" aria-label="See source 1">1</a>{' '}
              At the same time, access still needs to be managed safely and in
              accordance with the building contract and site procedures.
            </p>

            <section className="guide-short-answer">
              <p className="eyebrow">The important point</p>
              <h2>
                Everyone on a building site has a role. Only one of them is
                engaged by the homeowner.
              </h2>
              <p>
                The builder, site manager, building surveyor and bank all have
                roles in the construction process—but none of them is engaged
                solely to protect the homeowner’s interests. That is the role
                an independent inspector is intended to fill.
              </p>
              <p>
                If you are planning a new build, you can also view our{' '}
                <Link href="/new-home-inspections">
                  independent new home stage inspection service
                </Link>{' '}
                covering slab, frame, pre-plaster, fixing and practical
                completion stages.
              </p>
            </section>

            <section id="statutory-inspections">
              <p className="eyebrow">First-hand experience</p>
              <h2>Why we do not rely on statutory stage inspections alone</h2>
              <p>
                This view is not based only on online complaints or stories from
                homeowners. A member of the Home Audit team previously worked as
                an inspector within a Victorian building surveying practice.
              </p>
              <p>
                In that role, they were routinely expected to complete more than
                ten inspections in a single day. Once travel time, site access,
                photographs, document checks and reporting were taken into
                account, there was simply not enough time to examine every part
                of every job with the level of care most homeowners assume has
                taken place.
              </p>
              <p>
                The person who physically attended the site was also not the
                person whose signature appeared on the final inspection
                documents. In that practice, those documents were signed by the
                principal building surveyor rather than by the employee who had
                actually inspected the work.
              </p>
              <p>
                This does not mean every building surveying practice operates in
                the same way, or that every statutory inspection is inadequate.
                The experience taught something more important: a signed
                inspection outcome does not tell the homeowner how long the
                inspector spent on site, exactly what was examined, what may
                have been missed, or whether the person signing the document
                ever personally saw the work.
              </p>
              <p>
                A statutory inspection has an important regulatory purpose, but
                it is not the same thing as a detailed quality inspection
                carried out for the homeowner. It may focus on mandatory matters
                at a nominated construction stage. It does not necessarily
                verify every item of workmanship, every contractual requirement,
                every finish, or every part of the building that is about to be
                concealed.
              </p>
              <p>
                So when someone says “the building surveyor has already
                inspected it”, the homeowner should ask a different set of
                questions:
              </p>
              <ul>
                <li>Who physically attended the site?</li>
                <li>How much time was spent on the inspection?</li>
                <li>Which parts of the work were actually examined?</li>
                <li>Was the whole stage accessible at the time?</li>
                <li>Who signed the inspection outcome?</li>
                <li>
                  Was the inspection limited to statutory compliance, or did
                  anyone assess workmanship and the building contract on the
                  owner’s behalf?
                </li>
              </ul>
              <p>
                A certificate confirms that an inspection outcome was issued. It
                does not reveal the depth of the inspection behind it.
              </p>
            </section>

            <section id="four-roles">
              <p className="eyebrow">Who inspects what</p>
              <h2>The four inspections people often confuse</h2>
              <p>
                One reason homeowners are easily reassured is that several
                different people may inspect a new home during construction.
                Their roles are not the same.
              </p>
              <div className="scope-grid">
                {roles.map((role) => (
                  <div className="scope-item" key={role.title}>
                    <strong>{role.title}</strong>
                    <span>{role.text}</span>
                  </div>
                ))}
              </div>
            </section>

            <section id="common-claims">
              <p className="eyebrow">Common claims homeowners hear</p>
              <h2>Thirty statements that can talk an owner out of independent scrutiny</h2>
              <p>
                These statements are not automatically dishonest, and some are
                partly true. Each is worth testing before you give up your own
                inspection.
              </p>
            </section>

            {claimGroups.map((group) => (
              <section id={group.id} key={group.id}>
                <h2>{group.title}</h2>
                <div className="pressure-pattern-list">
                  {group.claims.map((claim) => (
                    <article className="pressure-pattern" key={claim.number}>
                      <span>{claim.number}</span>
                      <div>
                        <p className="pressure-label">What you may hear</p>
                        <h3>“{claim.claim}”</h3>
                        {claim.body.map((block, index) =>
                          typeof block === 'string' ? (
                            <p key={index}>{block}</p>
                          ) : (
                            <ul key={index}>
                              {block.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          ),
                        )}
                      </div>
                    </article>
                  ))}
                </div>
                {group.id === 'before-signing' ? (
                  <p>
                    See what is checked at each stage in our{' '}
                    <Link href="/new-home-inspections">
                      new home construction stage inspection service
                    </Link>
                    .
                  </p>
                ) : null}
              </section>
            ))}

            <section id="what-to-do">
              <p className="eyebrow">A practical alternative</p>
              <h2>What owners should do instead</h2>

              <h3>Before signing</h3>
              <p>If independent inspections matter to you, check the contract for:</p>
              <ul>
                <li>third-party access clauses;</li>
                <li>notice requirements;</li>
                <li>induction procedures;</li>
                <li>insurance requirements;</li>
                <li>inspection fees;</li>
                <li>report-review fees;</li>
                <li>extension-of-time clauses;</li>
                <li>limits on when an inspector can attend.</li>
              </ul>
              <p>
                If a clause appears designed to make independent inspection
                commercially or practically impossible, obtain advice before
                signing.
              </p>

              <h3>Before each construction stage</h3>
              <p>Confirm:</p>
              <ol>
                <li>what the builder considers “stage complete”;</li>
                <li>how much notice you will receive;</li>
                <li>the proposed inspection date;</li>
                <li>whether critical work will remain uncovered;</li>
                <li>any site-access requirements;</li>
                <li>who receives the report;</li>
                <li>the process for rectification and reinspection.</li>
              </ol>

              <h3>When an item is disputed</h3>
              <p>
                Do not turn every issue into an argument. Ask for the technical
                basis. A useful response usually identifies:
              </p>
              <ul>
                <li>what the inspector observed;</li>
                <li>the location;</li>
                <li>the applicable plan, specification, standard or instruction;</li>
                <li>the builder’s position;</li>
                <li>whether rectification is accepted;</li>
                <li>what will be done;</li>
                <li>when it will be done;</li>
                <li>what evidence will confirm completion.</li>
              </ul>

              <h3>Before a progress payment</h3>
              <p>
                Do not automatically refuse payment because an inspector has
                found defects. Progress payment rights and obligations depend on
                the contract and the facts. But also do not assume that a stage
                certificate means a private quality inspection is unnecessary.
              </p>
              <p>
                The safest approach is to plan the inspection window before the
                stage claim arrives, document material issues promptly, and
                obtain legal advice if there is a genuine payment dispute.
              </p>
            </section>

            <section id="stages">
              <p className="eyebrow">Planning your inspections</p>
              <h2>Which stages are most useful to inspect?</h2>
              <p>
                The ideal inspection schedule depends on the building system,
                contract and risk profile, but the most common independent
                new-home inspection stages include:
              </p>
              <div className="scope-grid">
                {stages.map((stage) => (
                  <div className="scope-item" key={stage.title}>
                    <strong>{stage.title}</strong>
                    <span>{stage.text}</span>
                  </div>
                ))}
              </div>
              <p>
                For the scope of each stage, see{' '}
                <Link href="/new-home-inspections">
                  independent new home stage inspections in Melbourne
                </Link>
                . For the final stage, see our{' '}
                <Link href="/practical-completion-inspection">
                  practical completion inspection
                </Link>{' '}
                page.
              </p>
            </section>

            <section className="guide-faq" id="questions" aria-labelledby="guide-faq-heading">
              <p className="eyebrow">Frequently asked questions</p>
              <h2 id="guide-faq-heading">Independent inspections during a new build</h2>
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
              <p className="eyebrow">The right question</p>
              <h2>Who inspected it, for whom, and what was still visible?</h2>
              <p>
                The strongest reason to use an independent inspector is not that
                every builder is dishonest. Most construction problems are more
                ordinary than that.
              </p>
              <p>
                Sites are busy. Supervisors manage multiple jobs. Trades vary.
                Work gets covered. Programs move quickly. Different consultants
                inspect for different purposes. That is exactly why independent
                inspection can be valuable: it creates a separate set of eyes
                whose client is the homeowner.
              </p>
              <p>
                First-hand experience inside a building surveying practice also
                taught our team not to confuse the existence of an inspection
                certificate with the depth of inspection that a homeowner may
                imagine sits behind it.
              </p>
              <p>
                The right question is not “has somebody inspected the house?” It
                is: who inspected it, for whom, at what stage, with what scope,
                and what was still visible when they arrived?
              </p>
            </section>

            <section className="guide-sources" id="sources" aria-labelledby="guide-sources-heading">
              <p className="eyebrow">Primary sources</p>
              <h2 id="guide-sources-heading">Guidance used in this article</h2>
              <ol>
                {sources.map((source) => (
                  <li id={source.id} key={source.id}>
                    <a href={source.href}>{source.label}</a>
                  </li>
                ))}
              </ol>
              <p>
                Sources were checked on 6 October 2026. This guide provides
                general information for Victorian homeowners and is not legal
                advice. Building contracts, site-access conditions, payment
                rights and dispute procedures vary. Obtain legal advice about
                your contract or a specific dispute.
              </p>
            </section>

            <aside className="guide-cta">
              <p className="eyebrow">Building in Melbourne?</p>
              <h2>Get your own evidence at the stages that are about to be covered.</h2>
              <p>
                Home Audit provides{' '}
                <Link href="/new-home-inspections">
                  independent new home stage inspections
                </Link>{' '}
                for slab, frame, pre-plaster, fixing and practical completion,
                with clear findings, scope and access limitations.
              </p>
              <div className="button-row">
                <Link className="button" href="/new-home-inspections">
                  View new home inspection options
                </Link>
                <Link className="text-link" href="/quote?service=new-home">
                  Request a new-home inspection quote <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </main>
  )
}
