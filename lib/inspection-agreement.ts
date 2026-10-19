// The Inspection Agreement the customer accepts before paying. Plain data, so
// the same text is shown on the order page, on /inspection-agreement and is
// fingerprinted (SHA-256) when it is accepted.
//
// Changing ANY wording means a new agreement: set AGREEMENT_VERSION to the
// date of the change and add its fingerprint to AGREEMENT_FINGERPRINTS
// (tests/inspection-agreement.test.ts prints the new value). Customers who
// accepted an older version keep that version for their inspection.
import {
  COMPANY_ACN,
  COMPANY_NAME,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  INSPECTOR_NAME,
  INSPECTOR_REGISTRATION,
  INSPECTOR_REGISTRATION_CLASS,
} from './site.ts'

export const AGREEMENT_VERSION = '2026-10-19'
export const AGREEMENT_TITLE = 'Inspection Agreement'
export const AGREEMENT_PATH = '/inspection-agreement'

// Late-cancellation rules (owner decision, 19 October 2026).
export const CANCELLATION_FEE_CENTS = 10_000
export const CANCELLATION_NOTICE_BUSINESS_DAYS = 3

export type AgreementBlock = string | { list: string[] }
export type AgreementSection = { id: string; heading: string; blocks: AgreementBlock[] }

/** SHA-256 of agreementPlainText() for each published version. */
export const AGREEMENT_FINGERPRINTS: Record<string, string> = {
  '2026-10-19': 'f4f59e173232feae48b2a25f5953f527f9302bd323cff2aad7658a33e5f8b3d5',
}

// The short version shown above the tick box. It must not say anything the
// full text does not.
export const AGREEMENT_KEY_POINTS = [
  'The inspection is visual and non-invasive. We only inspect areas we can reach safely on the day.',
  'Concealed areas, services such as electrical, plumbing and gas, pools, asbestos and compliance checks are not included.',
  'The report is for you only. It is the inspector’s opinion of the condition on the inspection day, not a full list of every problem.',
  'We do not agree to the report being used as the basis to buy, to negotiate the price or to budget for repairs. If you do not agree, please do not book.',
  'Cancelling 3 or more business days before the inspection costs $100. After that, the fee is not refunded.',
  'Our liability is limited to the inspection fee, as far as the law allows. Your rights under the Australian Consumer Law are not affected.',
]

export const AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    id: 'parties',
    heading: '1. Who this agreement is between',
    blocks: [
      `This agreement is between you, the client named on the order, and ${COMPANY_NAME} (ACN ${COMPANY_ACN}), trading as Home Audit. In this agreement, "we" and "us" mean ${COMPANY_NAME}.`,
      'It covers the inspection on your order. The order shows the property, the type of inspection and the fee.',
      `The inspection is carried out by ${INSPECTOR_NAME}, ${INSPECTOR_REGISTRATION_CLASS}, registration ${INSPECTOR_REGISTRATION}. We hold professional indemnity insurance.`,
      'You accept this agreement by ticking the box on your order page. We keep a record of the version you accepted and the time.',
      'This agreement must be accepted before the inspection takes place. Please read it in full before you pay.',
    ],
  },
  {
    id: 'standards',
    heading: '2. The standards we follow',
    blocks: [
      {
        list: [
          'Pre-purchase, pre-auction and building-only inspections follow AS 4349.1-2007 Inspection of buildings, Part 1: Pre-purchase inspections – Residential buildings.',
          'The timber pest part of a building and pest inspection follows AS 4349.3-2010 Inspection of buildings, Part 3: Timber pest inspections.',
          'New home stage inspections (such as pre-slab, frame, pre-plaster and fixing) and practical completion (handover) inspections are not covered by AS 4349.1. They are visual inspections of the work that can be seen at that stage. We compare it with the plans and specifications you give us, and with the National Construction Code and Australian Standards where this can be done by eye.',
        ],
      },
      'If you want something added to or removed from the standard scope, we will agree it with you in writing before the inspection.',
    ],
  },
  {
    id: 'scope',
    heading: '3. Scope of the inspection',
    blocks: [
      'The inspection is visual and non-invasive. We inspect the areas we can reach safely and reasonably on the day. We use our eyes and simple tools such as a torch, a ladder and a moisture meter.',
      'For a building inspection, we inspect these areas where safe access is available:',
      {
        list: [
          'the inside of the building;',
          'the outside of the building;',
          'the roof space, from the access opening and where it is safe to move;',
          'the roof outside, from a ladder or from the ground;',
          'the subfloor, where there is safe access and enough clearance;',
          'the site within 30 metres of the main building and within the property boundaries, such as fences, retaining walls, paths, driveways, garages, carports and sheds.',
        ],
      },
      'The building report records significant defects, the overall extent of minor defects, safety hazards we see, areas we could not inspect and why, and where we recommend further checks by a specialist.',
      'For a timber pest inspection, we look for visible evidence of termites, borers of seasoned timber and wood decay. We also note conditions that make timber pest attack more likely, such as moisture, poor ventilation and timber in contact with soil. The timber pest inspection covers the building and the site within 50 metres of the building and within the property boundaries, where access is safe.',
      'For a unit, apartment or townhouse in an owners corporation, we inspect the inside of the unit and its immediate outside, as set out in AS 4349.1. Common property, such as shared roofs, structures and grounds, is not inspected unless we agree in writing. We do not review owners corporation records.',
      'For a new home stage or practical completion inspection, we inspect the work that is visible and reachable at that stage. Work that is covered, not yet built or not safe to reach is not inspected.',
    ],
  },
  {
    id: 'exclusions',
    heading: '4. What is not included',
    blocks: [
      'The inspection does not include:',
      {
        list: [
          'areas we cannot reach safely and reasonably, including areas that are locked, too low or tight, or blocked by furniture, stored goods, floor coverings, vegetation, insulation, vehicles or occupants;',
          'anything hidden from view, such as inside walls, floors and ceilings, under concrete slabs and behind linings or tiles;',
          'invasive work, such as moving furniture or goods, lifting floor coverings, removing linings, cutting or drilling. If this is needed, it needs a separate written agreement and the owner’s permission;',
          'testing of electrical wiring, plumbing, gas, drains and sewers, hot water, heating and cooling, solar systems, appliances, smoke alarms, security and fire safety systems. Please use licensed tradespeople for these;',
          'swimming pools, spas and pool safety barriers;',
          'testing for asbestos, mould, lead or other hazardous materials. We may note material that could contain asbestos when we see it, but we do not test it;',
          'checking compliance with building permits, planning permits, council or owners corporation rules, or whether work was done with a permit;',
          'title, boundaries, easements, surveying, flooding and land overlays;',
          'engineering assessment of structure, footings or soil;',
          'estimates of repair costs;',
          'cosmetic items and normal wear and tear;',
          'defects that only appear in certain weather or conditions, or that develop after the inspection;',
          'termite treatment or any guarantee that timber pests are not present or will not attack in future;',
          'thermal imaging, unless your order says it is included.',
        ],
      },
      'Information from the agent, the vendor or other people is not checked by us unless the report says so.',
    ],
  },
  {
    id: 'access',
    heading: '5. Access and safety',
    blocks: [
      'You, or the agent or other person you nominate, need to arrange access for the agreed time. Please make sure power and water are connected, and that the roof space and subfloor access openings are clear.',
      'Please tell us before the inspection about anything that affects safety or access, such as pets, occupants, known problems or locked areas.',
      'We may stop or limit the inspection if it is not safe. This includes bad weather, unsafe structures, aggressive animals and hazards on site. Areas we could not inspect are listed in the report.',
      'If an area could not be inspected, we can come back once access is available. We will agree any fee for coming back with you first.',
    ],
  },
  {
    id: 'report',
    heading: '6. The report',
    blocks: [
      'We send the report by email after the inspection.',
      'Under the Australian Standards, the report is the inspector’s opinion of the condition seen on the day. It is not a full list of every problem with the property.',
      'The inspector’s opinion may be different from the actual condition of the property.',
      'We do not agree to you using the report as the basis to decide whether to buy the property, to negotiate the price, or as a budget for repairs. For those decisions, get advice from the right professionals, such as your lawyer or conveyancer, and quotes from licensed tradespeople.',
      'If you do not agree with this, please do not book our service.',
      'The report is for you only. Nobody else may rely on it without our written permission. As far as the law allows, we are not responsible to anyone else who relies on it.',
      'The report shows the condition of the property on the inspection day. Conditions can change after that.',
      'Please read the whole report, not just the summary. If anything is unclear, call us before you sign a contract or let a cooling-off period or finance date pass.',
      'The report is not a certificate of compliance, a warranty or an insurance policy. It does not replace advice from a lawyer, conveyancer, engineer or licensed tradesperson.',
      'If you buy at auction, the contract is usually unconditional. Make sure you have read the report, asked your questions and got the advice you need before you bid.',
    ],
  },
  {
    id: 'fees',
    heading: '7. Fees and payment',
    blocks: [
      'The fee is shown on your order and includes GST. It is paid online before the inspection.',
      'If the property is very different from what was described when you ordered, such as a larger building or extra buildings, we will tell you before we start. You can pay the extra fee we quote, or cancel and receive a full refund.',
    ],
  },
  {
    id: 'cancellation',
    heading: '8. Cancelling or changing the inspection',
    blocks: [
      {
        list: [
          'If you cancel 3 or more business days before the inspection date, we refund the fee less a $100 cancellation fee (including GST). If no date has been booked yet, the $100 fee also applies.',
          'If you cancel less than 3 business days before the inspection date, the fee is not refunded.',
          'If the inspector arrives at the agreed time and cannot get in because access was not available, this counts as a cancellation less than 3 business days before the inspection, and the fee is not refunded.',
          'You can ask to move the inspection to another time. If you ask 3 or more business days before the inspection date, there is no charge. A later change counts as a cancellation, unless we agree otherwise.',
          'If we need to cancel, for example because of illness or unsafe weather, we will offer you a new time or a full refund.',
        ],
      },
      'Business days are Monday to Friday, not counting Victorian public holidays.',
      'This section does not limit any right you have to a refund under the Australian Consumer Law.',
    ],
  },
  {
    id: 'liability',
    heading: '9. Limitation of liability',
    blocks: [
      'Nothing in this agreement excludes, restricts or changes any right or remedy you have under the Australian Consumer Law, or any other law, that cannot lawfully be excluded, restricted or changed.',
      'We are responsible for carrying out the inspection with due care and skill. This means finding defects that a competent inspector would find by a visual inspection of the areas covered by this agreement, on the day.',
      'We are not responsible for defects in areas or items that are not included (section 4), that were hidden or could not be reached, or that appear after the inspection.',
      'As far as the law allows, our total liability to you for any loss or damage arising from the inspection or the report, whether in contract, negligence or otherwise, is limited to the fee you paid for the inspection.',
      'Where the Australian Consumer Law allows our liability for a failure to meet a consumer guarantee to be limited, it is limited to supplying the inspection again or paying the cost of having it supplied again.',
      'As far as the law allows, we are not liable for indirect or consequential loss, such as loss of profit, loss of opportunity or loss of a bargain.',
      'If you believe something was missed, please tell us in writing as soon as you can. Please give us a chance to look before repairs start, unless the repair is urgent for safety.',
    ],
  },
  {
    id: 'complaints',
    heading: '10. Questions and complaints',
    blocks: [
      `Please contact us first on ${CONTACT_PHONE} or ${CONTACT_EMAIL}. We will work with you to resolve it.`,
      'If we cannot resolve it, you can contact Consumer Affairs Victoria or apply to the Victorian Civil and Administrative Tribunal (VCAT).',
    ],
  },
  {
    id: 'general',
    heading: '11. General',
    blocks: [
      'We handle your personal information as set out in our privacy notice.',
      'This agreement is governed by the laws of Victoria, Australia.',
      'This agreement and your order make up the whole agreement for the inspection. If any part of this agreement cannot be enforced, the rest still applies.',
      'We may update this agreement for future bookings. The version you accepted applies to your inspection.',
    ],
  },
]

/** The agreement as plain text: the exact text that is fingerprinted. */
export function agreementPlainText() {
  const lines = [`${AGREEMENT_TITLE} (version ${AGREEMENT_VERSION})`, '']
  for (const section of AGREEMENT_SECTIONS) {
    lines.push(section.heading)
    for (const block of section.blocks) {
      if (typeof block === 'string') lines.push(block)
      else for (const item of block.list) lines.push(`- ${item}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

/** "19 October 2026" for a version such as "2026-10-19". */
export function agreementVersionLabel(version = AGREEMENT_VERSION) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${version}T00:00:00Z`),
  )
}
