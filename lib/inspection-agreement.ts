// The Inspection Agreement the customer accepts before paying. Plain data, so
// the same text is shown on the order page, on /inspection-agreement and is
// fingerprinted (SHA-256) when it is accepted.
//
// Changing ANY wording means a new agreement: set AGREEMENT_VERSION to the
// date of the change and add its fingerprint to AGREEMENT_FINGERPRINTS
// (tests/inspection-agreement.test.ts prints the new value). Customers who
// accepted an older version keep that version for their inspection.
//
// Clause references are to AS 4349.1-2007 (owner's copy, reviewed 19 October 2026).
import { COMPANY_ACN, COMPANY_NAME, CONTACT_EMAIL, CONTACT_PHONE } from './site.ts'

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
  '2026-10-19': 'fdd25ef97754b5b3e18291bef374077436dbd319e53462423fa6a31c968222c9',
}

// The short version shown above the tick box. It must not say anything the
// full text does not.
export const AGREEMENT_KEY_POINTS = [
  'The inspection is visual and non-invasive. We only inspect areas we can reach safely on the day. Any access that needs a tool to open is treated as not accessible.',
  'Concealed areas, services such as electrical, plumbing and gas, pools, asbestos, timber pests (unless ordered) and compliance checks are not included.',
  'The report is the inspector’s opinion of the condition on the inspection day. It is not a full list of every problem, and another inspector may reach a different view.',
  'The report is advice only. It must not be the only basis for deciding to buy, negotiating the price or valuing the property. Your decisions and your appetite for risk are your own.',
  'You must read the full written report. Spoken comments are not guaranteed to be complete or accurate. Up to 15 minutes of phone time is included; extra time is charged.',
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
      'Our inspectors are registered as required by Victorian law. If you ask before the inspection, we will give you the inspector’s registration details. We hold professional indemnity insurance.',
      'You accept this agreement by ticking the box on your order page. We keep a record of the version you accepted and the time.',
      'This agreement must be accepted before the inspection takes place. Please read it in full before you pay. If you do not agree with it, please do not book our service.',
    ],
  },
  {
    id: 'standards',
    heading: '2. Purpose and the standards we follow',
    blocks: [
      {
        list: [
          'Pre-purchase, pre-auction and building-only inspections follow AS 4349.1-2007 Inspection of buildings, Part 1: Pre-purchase inspections – Residential buildings.',
          'The timber pest part of a building and pest inspection follows AS 4349.3-2010 Inspection of buildings, Part 3: Timber pest inspections. A building-only inspection does not include timber pests.',
          'New home stage inspections (such as pre-slab, frame, pre-plaster and fixing) and practical completion (handover) inspections are not covered by AS 4349.1. They are visual inspections of the work that can be seen at that stage. We compare it with the plans and specifications you give us, and with the National Construction Code and Australian Standards where this can be done by eye.',
        ],
      },
      'The purpose of a pre-purchase inspection is to give you advice about the condition of the property at the time of the inspection.',
      'As AS 4349.1 says, the inspection is a subjective appraisal by the inspector. Different inspectors, or the same inspector on another day, may reach different conclusions. The inspection is not a rigorous assessment of every part of the property.',
      'The building is compared with a building of similar age and type that was built to the accepted practice of its time and has been reasonably maintained. It is not checked against today’s building rules or Australian Standards, and it may not meet them.',
      'If you want something added to or removed from the standard scope, we will agree it with you in writing before the inspection.',
    ],
  },
  {
    id: 'scope',
    heading: '3. Scope of the inspection',
    blocks: [
      'The inspection is visual and non-invasive. Nothing is dismantled. We inspect the areas we can reach safely and reasonably on the day, and only what is in the inspector’s line of sight and close enough to assess. We use our eyes and simple tools such as a torch, a ladder and a moisture meter, and we do limited checks of how some items work.',
      'Any access that needs a tool to open is treated as not accessible. As AS 4349.1 says, reasonable access does not include cutting access holes or removing screws, bolts, other fastenings or sealants from access covers. This includes screwed or fixed access panels, hatches and covers, sealed or painted-shut openings, and locks. We do not open them, and the areas behind them are not inspected.',
      'The inspector decides on the day which areas can be reached safely. As a guide from AS 4349.1:',
      {
        list: [
          'roof spaces need an access hole of at least 400 × 500 mm and a crawl space of at least 600 × 600 mm, reachable from a 3.6 m ladder;',
          'roofs outside are inspected only where they can be seen safely from a 3.6 m ladder placed on the ground;',
          'subfloors are inspected only where there is safe access and enough clearance. Subfloors sprayed with chemicals are not entered unless it is safe.',
        ],
      },
      'For a building inspection, we inspect these areas where safe access is available:',
      {
        list: [
          'the inside of the building;',
          'the outside of the building;',
          'the roof space;',
          'the roof outside;',
          'the subfloor;',
          'the site within 30 metres of the main building and within the property boundaries, such as garages, carports, detached laundries, sheds, retaining walls over 700 mm high, paths, driveways, steps, fences and surface water drainage.',
        ],
      },
      'The building report records major defects, a general impression of the extent of minor defects, and any serious safety hazards we see. It does not list every minor defect. It may only list defects, not the items that are in good condition. It also lists areas we could not inspect and why, and where we recommend a specialist.',
      'For a timber pest inspection, we look for visible evidence of termites, borers of seasoned timber and wood decay. We also note conditions that make timber pest attack more likely, such as moisture, poor ventilation and timber in contact with soil. The timber pest inspection covers the building and the site within 50 metres of the building and within the property boundaries, where access is safe.',
      'For a unit, apartment or townhouse in an owners corporation (strata or company title), we inspect only the inside of the unit and its immediate outside. Common property, such as shared roofs, structures and grounds, is not inspected. We do not review owners corporation records. As an owner, you may have to pay towards repairs to the whole of the common property, so the report may say little about your total repair costs. If we see clear signs of a major defect, we may recommend an inspection of the common property.',
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
          'areas behind any access that needs a tool to open, such as screwed or fixed panels, hatches and covers;',
          'areas we cannot reach safely and reasonably, including areas that are locked, too low or tight, or blocked by furniture, stored goods, floor coverings, vegetation, insulation, ducts, pipes, vehicles or occupants;',
          'anything hidden from view, such as footings below ground, concealed damp-proof courses, framing, tie-downs and bracing inside walls, and areas under concrete slabs, enclosed patios, hearths and behind linings, sidings or tiles;',
          'invasive work, such as moving furniture or goods, lifting floor coverings, removing linings, cutting or drilling. If this is needed, it needs a separate written agreement and the owner’s permission;',
          'electrical installations, smoke alarms, switches and light fittings, TV, phone, internet, intercom, alarm and security systems;',
          'concealed plumbing, drains and sewers, gas fittings, hot water, air conditioning and heating, fireplaces, chimneys and flues, solar systems and water tanks;',
          'appliances and other mechanical or electrical equipment, such as dishwashers, ovens, ducted vacuums, automatic garage doors, gates and lifts;',
          'swimming pools, spas and their equipment;',
          'how well the roof drainage works as installed;',
          'timber and metal framing sizes and whether they are adequate;',
          'soil conditions, control joints, landscaping and rubbish;',
          'soft floor coverings, floor coverings generally, paint coatings other than external protective coatings, furniture, stored items and insulation;',
          'health hazards, such as allergies, mould, soil contamination, lead, radon, asbestos and urea formaldehyde. We may note material that could contain asbestos when we see it, but we do not test it;',
          'energy and lighting efficiency, sustainability and other environmental matters;',
          'timber pest activity, unless your order includes a timber pest inspection;',
          'whether work was done with a permit, whether any work is unauthorised, and compliance with any Act, regulation, building or planning permit, council rule or owners corporation rule;',
          'title, ownership, boundaries, easements, covenants, zoning, surveying, flooding and land overlays, and other legal matters;',
          'engineering assessment of structure, footings or soil;',
          'estimates of repair costs. These are hard to estimate reliably before work starts. Please get quotes from licensed tradespeople;',
          'cosmetic items and normal wear and tear;',
          'defects that only appear in certain weather or with recent use. For example, a shower that is dry on the day may still leak, and a roof may only leak in heavy rain;',
          'defects that develop after the inspection;',
          'thermal imaging, unless your order says it is included.',
        ],
      },
      'The report assumes the property will keep its current use.',
    ],
  },
  {
    id: 'access',
    heading: '5. Access, information and safety',
    blocks: [
      'Arranging the right of entry to the property is your responsibility. We may contact the agent or the person you nominate to help arrange a time, but we are not responsible if entry is not given. Areas where entry is not given are not part of the inspection.',
      'Please make sure power and water are connected, and that the roof space and subfloor access openings are clear.',
      'Please tell us before the inspection about anything that affects safety or access, and anything you know about the property, such as past repairs, leaks, cracks, pests, occupants, pets or locked areas.',
      'The report relies on the information given to us by you, the agent, the vendor and others. We do not check that information unless the report says so.',
      'We are not responsible for defects that have been hidden or disguised, for example by fresh paint, new coverings, furniture or stored goods.',
      'We may stop or limit the inspection if it is not safe. This includes bad weather, unsafe structures, aggressive animals, chemicals and other hazards on site. Areas we could not inspect are listed in the report.',
      'If an area could not be inspected, we can come back once access is available. We will agree any fee for coming back with you first.',
    ],
  },
  {
    id: 'report',
    heading: '6. The report',
    blocks: [
      'We provide the report as a digital copy after the inspection. We may email it to you or make it available to download from our website. Please save a copy for your records.',
      'Under the Australian Standards, the report is the inspector’s opinion of the condition seen on the day. It is not a full list of every problem with the property.',
      'The inspector’s opinion may be different from the actual condition of the property.',
      'The report is advice. It must not be used on its own as the only basis for deciding to buy the property, negotiating the price or valuing the property. It is not a valuation or a repair budget. Your decision, and how much risk you are willing to accept, are your own. For those decisions, also get advice from the right professionals, such as your lawyer or conveyancer, and quotes from licensed tradespeople.',
      'If the report recommends further inspection by a specialist, such as an electrician, plumber, structural engineer or pest inspector, please arrange it before you buy. We are not responsible for matters that the specialist inspection would have found.',
      'You must read the whole written report, not just the summary. Do not rely on anything the inspector says on site or on the phone. Spoken comments are not guaranteed to be complete or accurate. Only the written report counts.',
      'Each inspection includes up to 15 minutes of phone time with the inspector to talk about the report. Time beyond 15 minutes is charged. We will tell you the rate before the call goes past 15 minutes, and only charge if you agree.',
      'If anything in the report is unclear, call us before you sign a contract or let a cooling-off period or finance date pass.',
      'The report is for you only. Nobody else may rely on it without our written permission, including the vendor, the agent, other buyers and lenders. As far as the law allows, we are not responsible to anyone else who relies on it. You may give a copy to your lawyer, conveyancer or lender to help with your purchase.',
      'The report shows the condition of the property on the inspection day. Conditions can change after that.',
      'The report is not a certificate of compliance, a warranty against future problems or an insurance policy. It does not replace advice from a lawyer, conveyancer, engineer or licensed tradesperson.',
      'Your contract of sale may say who must prepare a report for a building inspection condition. Please check with your lawyer or conveyancer that our report meets your contract before you rely on that condition.',
      'If you buy at auction, the contract is usually unconditional. Make sure you have read the report, asked your questions and got the advice you need before you bid.',
      'We own the copyright in the report, photos and site notes. We keep our site records.',
    ],
  },
  {
    id: 'fees',
    heading: '7. Fees and payment',
    blocks: [
      'The fee is shown on your order and includes GST. It is paid online before the inspection. If a fee is unpaid, we may hold the report until it is paid.',
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
      'As far as the law allows, we are not liable for indirect or consequential loss, such as loss of profit, loss of opportunity, loss of a bargain or a change in the value of the property.',
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
