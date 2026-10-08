export type Guide = {
  slug: string
  path: string
  title: string
  shortTitle: string
  description: string
  excerpt: string
  category: string
  datePublished: string
  dateModified: string
  displayDate: string
  displayModifiedDate?: string
  readingTime: string
  homepageEyebrow: string
  homepageHighlights: readonly {
    label: string
    value: string
  }[]
}

export const GUIDES: readonly Guide[] = [
  {
    slug: 'agent-pressure-skip-building-inspection',
    path: '/guides/agent-pressure-skip-building-inspection',
    title: 'When an agent wants you to skip the building inspection',
    shortTitle: 'Agent pressure and building inspections',
    description:
      'How Victorian buyers can respond when an agent says the vendor refuses an inspection, another offer is unconditional or an existing report is enough.',
    excerpt:
      'The pressure may be real, exaggerated or simply part of negotiating for the seller. Before accepting an unknown repair risk, understand exactly what information or protection you are being asked to give up.',
    category: 'Buyer protection',
    datePublished: '2026-10-04T11:00:00+11:00',
    dateModified: '2026-10-04T13:26:00+11:00',
    displayDate: '4 October 2026',
    readingTime: '14 min read',
    homepageEyebrow: 'Buyer protection guide',
    homepageHighlights: [
      { label: 'Warning sign', value: 'Skip due diligence' },
      { label: 'Best response', value: 'Keep your own limits' },
      { label: 'Case location', value: 'Dromana · Victoria' },
    ],
  },
  {
    slug: 'building-inspection-buyers-market',
    path: '/guides/building-inspection-buyers-market',
    title: 'When does a building inspection have the most negotiating power?',
    shortTitle: 'When is a building inspection most valuable?',
    description:
      "A building inspection has the most negotiating power when a seller cannot easily replace a buyer. See how Melbourne's 2026 market shifts the balance.",
    excerpt:
      'A building inspection always helps a buyer understand risk. Its commercial value is greatest when listings take longer to sell, buyers have alternatives and a vendor cannot assume another unconditional offer will arrive tomorrow.',
    category: 'Market insight',
    datePublished: '2026-10-03T09:00:00+10:00',
    dateModified: '2026-10-04T00:30:00+10:00',
    displayDate: '3 October 2026',
    displayModifiedDate: '4 October 2026',
    readingTime: '13 min read',
    homepageEyebrow: 'Market insight for buyers',
    homepageHighlights: [
      { label: 'Strongest point', value: 'Cooling market' },
      { label: 'Primary use', value: 'Risk + evidence' },
      { label: 'Current context', value: 'Melbourne · 2026' },
    ],
  },
  {
    slug: 'independent-new-home-stage-inspections',
    path: '/guides/independent-new-home-stage-inspections',
    title: 'What builders may tell you about independent new home stage inspections',
    shortTitle: 'Independent new home stage inspections',
    description:
      'Building a new home in Victoria? Learn the common reasons builders, site managers and sales consultants give for discouraging independent stage inspections—and what owners should check before slab, frame, pre-plaster and handover.',
    excerpt:
      'The building surveyor, the builder’s quality team, the bank and the Occupancy Permit each do something real. None of them replaces an inspector engaged by the homeowner. Thirty common claims, and what each one leaves unchecked.',
    category: 'Building a new home',
    datePublished: '2026-10-06T03:00:00+11:00',
    dateModified: '2026-10-06T03:00:00+11:00',
    displayDate: '6 October 2026',
    readingTime: '18 min read',
    homepageEyebrow: 'New-home guide for owners',
    homepageHighlights: [
      { label: 'Common claims', value: 'Thirty, explained' },
      { label: 'Key stages', value: 'Slab to handover' },
      { label: 'Applies to', value: 'New builds · Victoria' },
    ],
  },
  {
    slug: 'major-building-defect-vs-major-structural-defect-victoria',
    path: '/guides/major-building-defect-vs-major-structural-defect-victoria',
    title:
      'Major building defect vs major structural defect: what Victorian home buyers need to check',
    shortTitle: 'Major building defect or major structural defect?',
    description:
      'Buying an older home in Victoria? Learn how major building defect and major structural defect clauses differ, plus 15 contract and property red flags.',
    excerpt:
      'Many buyers assume a building inspection clause lets them walk away if the report is bad. Here is the contract wording, the deadlines and the older-home warning signs to check before you sign.',
    category: 'Contracts and inspections',
    datePublished: '2026-10-07T00:30:00+11:00',
    dateModified: '2026-10-07T00:30:00+11:00',
    displayDate: '7 October 2026',
    readingTime: '15 min read',
    homepageEyebrow: 'Buyer guide · Contracts and inspections',
    homepageHighlights: [
      { label: 'Key wording', value: 'Building vs structural' },
      { label: 'Red flags', value: 'Fifteen to check' },
      { label: 'Applies to', value: 'Established homes · Victoria' },
    ],
  },
  {
    slug: 'pre-slab-inspection-glen-waverley',
    path: '/guides/pre-slab-inspection-glen-waverley',
    title: 'Why a pre-slab inspection matters: one Glen Waverley site lesson',
    shortTitle: 'Pre-slab inspection in Glen Waverley',
    description:
      'A Glen Waverley slab inspection found reinforcement too close to a drainage pipe before the pour. Why approved drawings alone are not enough.',
    excerpt:
      'A drainage pipe, the reinforcement next to it and a builder with 30 years behind him: what one Glen Waverley inspection shows about checking a slab before the concrete pour.',
    category: 'Building a new home',
    datePublished: '2026-10-08T20:30:00+11:00',
    dateModified: '2026-10-08T20:30:00+11:00',
    displayDate: '8 October 2026',
    readingTime: '10 min read',
    homepageEyebrow: 'New-home case study · Glen Waverley',
    homepageHighlights: [
      { label: 'Stage', value: 'Before the slab pour' },
      { label: 'Found', value: 'Steel too close to a drain' },
      { label: 'Location', value: 'Glen Waverley · Victoria' },
    ],
  },
] as const

export const FEATURED_GUIDE = GUIDES[0]
export const AGENT_PRESSURE_GUIDE = GUIDES[0]
export const BUYERS_MARKET_GUIDE = GUIDES[1]
export const NEW_HOME_STAGE_GUIDE = GUIDES[2]
export const DEFECT_CLAUSE_GUIDE = GUIDES[3]
export const PRE_SLAB_GUIDE = GUIDES[4]
