// The Inspection Agreement the customer accepts before paying. Plain data, so
// the same text is shown on the order page, on /inspection-agreement and is
// fingerprinted (SHA-256) when it is accepted.
//
// Changing ANY wording means a new agreement: set AGREEMENT_VERSION to the
// date of the change and add its fingerprint to AGREEMENT_FINGERPRINTS
// (tests/inspection-agreement.test.ts prints the new value). Customers who
// accepted an older version keep that version for their inspection.
//
// Formal contract style (owner decision, 19 October 2026), kept clear enough
// to meet the Australian Consumer Law transparency test. Clause references in
// comments are to AS 4349.1-2007 (owner's copy).
import { COMPANY_ACN, COMPANY_NAME, CONTACT_EMAIL, CONTACT_PHONE } from './site.ts'

export const AGREEMENT_VERSION = '2026-10-27'
export const AGREEMENT_TITLE = 'Inspection Agreement'
export const AGREEMENT_PATH = '/inspection-agreement'

// Late-cancellation rules (owner decision, 19 October 2026).
export const CANCELLATION_FEE_CENTS = 10_000
export const CANCELLATION_NOTICE_BUSINESS_DAYS = 3

export type AgreementBlock = string | { list: string[] }
export type AgreementSection = { id: string; heading: string; blocks: AgreementBlock[] }

/** SHA-256 of agreementPlainText() for each published version. */
export const AGREEMENT_FINGERPRINTS: Record<string, string> = {
  '2026-10-19': 'e18fe2132da40a9c9a14f28b2f3d2e364cd67a03a855864bd24e30dee08cfc72',
  '2026-10-27': '9b97522a8bf352659e8523baedf0504b0d1333bcdadbd828a03e71ca77bb1590',
}

// The plain-English summary shown above the tick box. It must not say
// anything the full text does not.
export const AGREEMENT_KEY_POINTS = [
  'The inspection is visual and non-invasive. Only areas that can be reached safely on the day are inspected. Any access that needs a tool to open is treated as not accessible.',
  'Concealed areas, services such as electrical, plumbing and gas, pools, asbestos, timber pests (unless ordered) and compliance checks are not included.',
  'The report is the inspector’s opinion of the condition on the inspection day. It is not a full list of every problem, and another inspector may reach a different view.',
  'The report is advice only. It must not be the only basis for deciding to buy, negotiating the price or valuing the property. Your decisions and your appetite for risk are your own.',
  'You must read the full written report. Spoken comments are not guaranteed to be complete or accurate. Up to 15 minutes of phone time is included; extra time is charged.',
  'Cancelling 3 or more business days before the inspection costs $100. After that, the fee is not refunded.',
  'Our liability is limited to the inspection fee, as far as the law allows. Your rights under the Australian Consumer Law are not affected.',
  'Download and keep your own copy of the report and its photos. We do not have to store them or send them again. The report is for you only; we may sell copies to other buyers in their own name, without your name or contact details.',
]

export const AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    id: 'parties',
    heading: '1. Parties and interpretation',
    blocks: [
      `1.1 This Agreement is made between the person named as the client in the Order (the "Client") and ${COMPANY_NAME} (ACN ${COMPANY_ACN}) trading as Home Audit (the "Company").`,
      '1.2 In this Agreement:',
      {
        list: [
          '"Agreement" means this Inspection Agreement together with the Order;',
          '"Order" means the order for the Inspection placed through the Company’s website, which specifies the Property, the type of Inspection and the Fee;',
          '"Property" means the property identified in the Order;',
          '"Inspection" means the inspection of the Property described in the Order and carried out under this Agreement;',
          '"Report" means the written report of the Inspection provided by the Company;',
          '"Fee" means the fee for the Inspection stated in the Order, inclusive of GST;',
          '"Inspection Date" means the date on which the Inspection is booked to take place;',
          '"Business Day" means a day other than a Saturday, a Sunday or a public holiday in Victoria;',
          '"ACL" means the Australian Consumer Law set out in Schedule 2 to the Competition and Consumer Act 2010 (Cth);',
          '"AS 4349.1" means AS 4349.1-2007 Inspection of buildings, Part 1: Pre-purchase inspections – Residential buildings; and',
          '"AS 4349.3" means AS 4349.3-2010 Inspection of buildings, Part 3: Timber pest inspections.',
        ],
      },
      '1.3 Headings are for convenience only. The singular includes the plural. The words "including" and "such as" are not words of limitation.',
    ],
  },
  {
    id: 'acceptance',
    heading: '2. Acceptance',
    blocks: [
      '2.1 The Client accepts this Agreement by ticking the acceptance box on the Client’s order page. The Company records the version of this Agreement accepted and the time of acceptance.',
      '2.2 This Agreement must be accepted before the Inspection takes place. The Client acknowledges that the Client has had the opportunity to read this Agreement in full before paying the Fee.',
      '2.3 If the Client does not agree with any term of this Agreement, the Client must not book the Inspection.',
      '2.4 The Company’s inspectors are registered as required by the laws of Victoria. If the Client so requests before the Inspection, the Company will provide the registration details of the inspector. The Company maintains professional indemnity insurance.',
    ],
  },
  {
    id: 'standards',
    heading: '3. Purpose, standards and basis of assessment',
    blocks: [
      '3.1 The Inspection is carried out as follows:',
      {
        list: [
          '(a) a pre-purchase, pre-auction or building-only inspection is carried out in accordance with AS 4349.1;',
          '(b) the timber pest component of a building and pest inspection is carried out in accordance with AS 4349.3. A building-only inspection does not include timber pests; and',
          '(c) a new home stage inspection (including pre-slab, frame, pre-plaster and fixing) or a practical completion (handover) inspection is not within the scope of AS 4349.1. It is a visual inspection of the work visible at that stage, compared with the plans and specifications provided by the Client and, where this can be assessed visually, with the National Construction Code and relevant Australian Standards.',
        ],
      },
      '3.2 The purpose of a pre-purchase inspection is to provide advice to the Client regarding the condition of the Property at the time of the Inspection.',
      '3.3 The Client acknowledges that, as stated in AS 4349.1, the Inspection involves a subjective appraisal by the inspector. Different inspectors, or the same inspector on a different occasion, may reach different conclusions. The Inspection is not a rigorous assessment of every building element of the Property.',
      '3.4 The building is compared with a building of similar age and type that was constructed in accordance with the generally accepted practice at the time of its construction and has been maintained without significant loss of strength or serviceability. The building is not assessed against current building regulations or Australian Standards, and it may not comply with them.',
    ],
  },
  {
    id: 'scope',
    heading: '4. Scope of the Inspection',
    blocks: [
      '4.1 The Inspection is visual and non-invasive and is carried out without dismantling. It is limited to areas to which safe and reasonable access is available on the Inspection Date, and to what is within the inspector’s line of sight and close enough to enable reasonable appraisal.',
      '4.2 Any access that requires a tool to open is treated as not accessible. In accordance with AS 4349.1, reasonable access does not include cutting access holes or removing screws, bolts, other fastenings or sealants from access covers. This includes screwed or fixed access panels, hatches and covers, sealed or painted-shut openings, and locks. The Company does not open them, and the areas behind them are not inspected.',
      '4.3 The inspector determines on the Inspection Date which areas can be accessed safely and reasonably. As a guide, in accordance with AS 4349.1:',
      {
        list: [
          '(a) a roof space is inspected only where it has an access hole of not less than 400 × 500 mm and a crawl space of not less than 600 × 600 mm, and is accessible from a 3.6 m ladder;',
          '(b) a roof exterior is inspected only where it can be safely viewed from a 3.6 m ladder placed on the ground; and',
          '(c) a subfloor is inspected only where safe access and sufficient clearance are available. A subfloor sprayed with chemicals is not entered unless it is safe to do so.',
        ],
      },
      '4.4 Subject to clauses 4.1 to 4.3, a building inspection covers the following areas:',
      {
        list: [
          '(a) the interior of the building;',
          '(b) the exterior of the building;',
          '(c) the roof space;',
          '(d) the roof exterior;',
          '(e) the subfloor; and',
          '(f) the site within 30 metres of the main building and within the boundaries of the Property, including garages, carports, detached laundries, sheds, retaining walls more than 700 mm high, paths, driveways, steps, fences and surface water drainage.',
        ],
      },
      '4.5 The Report for a building inspection identifies major defects, gives a general impression of the extent of minor defects, and identifies any observed serious safety hazard. Individual minor defects are not listed. The Report may list defects only and need not refer to items in acceptable condition. The Report also identifies areas not inspected and the reason, and any recommendation for further inspection by a specialist.',
      '4.6 A timber pest inspection is limited to visible evidence of termites, borers of seasoned timber and wood decay, and to conditions conducive to timber pest attack, such as excessive moisture, inadequate ventilation and timber in contact with soil. It covers the building and the site within 50 metres of the building and within the boundaries of the Property, where safe access is available.',
      '4.7 For a property under strata or company title or in an owners corporation, the Inspection is limited to the interior and the immediate exterior of the nominated residence. Common property is not inspected, and owners corporation records are not reviewed. The Client acknowledges that an owner may be liable to contribute to the cost of repairs to the whole of the common property, and that the Report may therefore be of limited assistance in assessing the Client’s total liability for repairs. Where clear evidence of a major defect is apparent, the Company may recommend an inspection of the common property.',
      '4.8 A new home stage inspection or practical completion inspection is limited to work that is visible and accessible at that stage. Work that is concealed, not yet constructed or not safely accessible is not inspected.',
    ],
  },
  {
    id: 'exclusions',
    heading: '5. Exclusions',
    blocks: [
      '5.1 The Inspection does not include, and the Report does not address, the following:',
      {
        list: [
          '(a) any area behind an access that requires a tool to open, including screwed or fixed panels, hatches and covers;',
          '(b) any area to which safe and reasonable access is not available, including areas that are locked, too low or confined, or obstructed by furniture, stored goods, floor coverings, vegetation, insulation, ducts, pipes, vehicles or occupants;',
          '(c) anything concealed, including footings below ground, concealed damp-proof courses, framing, tie-downs and bracing within walls, and areas beneath concrete slabs, enclosed patios and hearths or behind linings, sidings or tiles;',
          '(d) any invasive work, including moving furniture or goods, lifting floor coverings, removing linings, cutting or drilling, which may only be undertaken under a separate written agreement and with the owner’s consent;',
          '(e) electrical installations, smoke alarms, switches and light fittings, and television, telephone, internet, intercom, alarm and security systems;',
          '(f) concealed plumbing, drains and sewers, gas fittings, hot water, air conditioning and heating, fireplaces, chimneys and flues, solar systems and water tanks;',
          '(g) appliances and other mechanical or electrical equipment, including dishwashers, ovens, ducted vacuum systems, automatic garage doors, gates and lifts;',
          '(h) swimming pools, spas and associated equipment;',
          '(i) the adequacy of roof drainage as installed;',
          '(j) the size and adequacy of timber and metal framing;',
          '(k) soil conditions, control joints, landscaping and rubbish;',
          '(l) floor coverings, paint coatings other than external protective coatings, furniture, stored items and insulation;',
          '(m) health hazards, including allergens, mould, soil contamination, lead, radon, asbestos and urea formaldehyde. Material that may contain asbestos may be noted where observed, but no testing is carried out;',
          '(n) energy and lighting efficiency, sustainability and other environmental matters;',
          '(o) timber pest activity, unless the Order includes a timber pest inspection;',
          '(p) whether any work was carried out with a permit, whether any work is unauthorised, and compliance with any Act, regulation, building or planning permit, council requirement or owners corporation rule;',
          '(q) title, ownership, boundaries, easements, covenants, zoning, surveying, flooding, land overlays and other legal matters;',
          '(r) any engineering assessment of the structure, footings or soil;',
          '(s) any estimate of the cost of rectification. Such costs cannot be estimated reliably before work commences, and the Client should obtain quotations from licensed tradespeople;',
          '(t) cosmetic matters and fair wear and tear;',
          '(u) defects whose detection depends on weather conditions or recent use, such as a shower that is dry on the Inspection Date but leaks in use, or a roof that leaks only in heavy rain;',
          '(v) defects that develop after the Inspection; and',
          '(w) thermal imaging, unless the Order states that it is included.',
        ],
      },
      '5.2 The Report assumes that the existing use of the Property will continue.',
    ],
  },
  {
    id: 'access',
    heading: '6. Access, information and safety',
    blocks: [
      '6.1 The Client is responsible for arranging the right of entry to the Property. The Company may contact the agent or a person nominated by the Client to assist in arranging a time, but the Company is not responsible if entry is not given. Areas to which entry is not given do not form part of the Inspection.',
      '6.2 The Client must ensure that power and water are connected and that access openings to the roof space and subfloor are unobstructed.',
      '6.3 The Client must inform the Company before the Inspection of any matter affecting safety or access, and of any matter known to the Client concerning the Property, including past repairs, leaks, cracking, pests, occupants, pets and locked areas.',
      '6.4 The Report is conditional on the information provided by the Client, the agent, the vendor and others. The Company does not verify that information unless the Report states otherwise.',
      '6.5 The Company is not responsible for any defect that has been concealed or disguised, including by fresh paint, new coverings, furniture or stored goods.',
      '6.6 The Company may suspend or limit the Inspection if, in the inspector’s opinion, it is unsafe to continue, including because of weather, unsafe structures, animals, chemicals or other hazards. Areas not inspected are identified in the Report.',
      '6.7 Where an area could not be inspected, the Company may re-attend once access is available, for a fee agreed with the Client in advance.',
    ],
  },
  {
    id: 'report',
    heading: '7. The Report',
    blocks: [
      '7.1 The Company provides the Report in digital form after the Inspection, by email or by making it available for download from the Company’s website. The Client should retain a copy for the Client’s records.',
      '7.2 In accordance with the Australian Standards, the Report is the inspector’s opinion of the condition observed on the Inspection Date. It is not an exhaustive list of every defect in the Property.',
      '7.3 The inspector’s opinion may differ from the actual condition of the Property.',
      '7.4 The Report is advice only. It must not be relied upon as the sole basis for deciding whether to purchase the Property, negotiating the price or valuing the Property. The Report is not a valuation or a budget for repairs. Any decision concerning the Property, and the degree of risk the Client is willing to accept, remain solely the Client’s responsibility. The Client should also obtain advice from appropriate professionals, such as a lawyer or conveyancer, and quotations from licensed tradespeople.',
      '7.5 Where the Report recommends further inspection by a specialist, such as an electrician, plumber, structural engineer or pest inspector, the Client should obtain that inspection before purchasing the Property. The Company is not responsible for any matter that such an inspection would have identified.',
      '7.6 The Client must read the whole of the written Report and not only its summary. The Client must not rely on any oral statement made by the inspector, whether on site or by telephone. Oral statements are not warranted to be complete or accurate. Only the written Report forms the Company’s advice.',
      '7.7 The Fee includes up to 15 minutes of telephone discussion with the inspector concerning the Report. Time beyond 15 minutes is charged. The Company will inform the Client of the applicable rate before the call exceeds 15 minutes and will charge only if the Client agrees.',
      '7.8 If any part of the Report is unclear, the Client should contact the Company before signing a contract of sale or allowing any cooling-off period or finance date to expire.',
      '7.9 The Report is provided solely for the Client. No other person, including the vendor, an agent, another prospective purchaser or a lender, may rely on it without the Company’s written consent. To the extent permitted by law, the Company has no liability to any other person who relies on the Report. The Client may provide a copy to the Client’s lawyer, conveyancer or lender for the purpose of the Client’s purchase.',
      '7.10 The Report reflects the condition of the Property on the Inspection Date. Conditions may change after that date.',
      '7.11 The Report is not a certificate of compliance, a warranty against future defects or a policy of insurance, and it does not replace advice from a lawyer, conveyancer, engineer or licensed tradesperson.',
      '7.12 A contract of sale may specify who must prepare a report for the purposes of a building inspection condition. The Client should confirm with the Client’s lawyer or conveyancer that the Report satisfies the contract before relying on that condition.',
      '7.13 A purchase at auction is usually unconditional. The Client should read the Report, raise any questions and obtain any advice required before bidding.',
      '7.14 Copyright in the Report, photographs and site notes remains with the Company.',
      '7.15 Because copyright remains with the Company, the Company may provide the Report, or a copy of it, to any other person, including another prospective purchaser of the Property, and may charge that person a fee. A copy provided to another person is issued in that person’s name and does not include the Client’s name or contact details. The Client is not entitled to any part of that fee, and the Fee paid by the Client is not affected.',
      '7.16 The Client must not sell, publish or give the Report to any other person, except as permitted by clause 7.9.',
      '7.17 The Company provides the Report electronically, by a link sent to the Client’s email address. The Client is responsible for downloading the Report promptly and for keeping the Client’s own copy of the Report, including the photographs in it. The link is available for a limited period, currently 180 days after it is sent.',
      '7.18 The Company is not obliged to store the Report, the photographs (whether or not they appear in the Report), site notes or any other record of the Inspection, or to provide a further copy of the Report or any photographs, except where the law requires the Company to keep a record. If the Report or photographs are lost by the Client, the Company has no liability for that loss. If the Company agrees to provide a further copy, it may charge a reasonable fee.',
    ],
  },
  {
    id: 'fees',
    heading: '8. Fee and payment',
    blocks: [
      '8.1 The Fee is payable online in full before the Inspection. The Company may withhold the Report until any unpaid amount is paid.',
      '8.2 If the Property differs materially from its description in the Order, including in the size of the building or the number of buildings, the Company will notify the Client before the Inspection begins. The Client may either pay the additional fee quoted or cancel and receive a full refund.',
    ],
  },
  {
    id: 'cancellation',
    heading: '9. Cancellation and rescheduling',
    blocks: [
      '9.1 The following applies to cancellation and rescheduling:',
      {
        list: [
          '(a) if the Client cancels 3 or more Business Days before the Inspection Date, the Company will refund the Fee less a cancellation fee of $100 (inclusive of GST). The same cancellation fee applies if the Client cancels before an Inspection Date has been booked;',
          '(b) if the Client cancels less than 3 Business Days before the Inspection Date, the Fee is not refunded;',
          '(c) if the inspector attends at the agreed time and is unable to gain entry because access was not available, this is treated as a cancellation less than 3 Business Days before the Inspection Date, and the Fee is not refunded;',
          '(d) the Client may request that the Inspection be rescheduled. A request made 3 or more Business Days before the Inspection Date is accepted without charge. A later request is treated as a cancellation unless the Company agrees otherwise; and',
          '(e) if the Company cancels the Inspection, including because of illness or unsafe weather, the Company will offer the Client a new time or a full refund.',
        ],
      },
      '9.2 Nothing in this clause limits any right the Client may have to a refund under the ACL.',
    ],
  },
  {
    id: 'liability',
    heading: '10. Limitation of liability',
    blocks: [
      '10.1 Nothing in this Agreement excludes, restricts or modifies any right or remedy of the Client under the ACL, or under any other law, that cannot lawfully be excluded, restricted or modified.',
      '10.2 The Company will carry out the Inspection with due care and skill. This means identifying defects that a competent inspector would identify by a visual inspection, on the Inspection Date, of the areas within the scope of this Agreement.',
      '10.3 The Company is not liable for any defect in an area or item excluded under clause 5, or that was concealed or not accessible, or that arises after the Inspection.',
      '10.4 To the extent permitted by law, the Company’s total liability to the Client for any loss or damage arising out of or in connection with the Inspection or the Report, whether in contract, tort (including negligence) or otherwise, is limited to the amount of the Fee paid.',
      '10.5 Where the ACL permits the Company’s liability for a failure to comply with a consumer guarantee to be limited, that liability is limited to supplying the Inspection again or paying the cost of having it supplied again.',
      '10.6 To the extent permitted by law, the Company is not liable for any indirect or consequential loss, including loss of profit, loss of opportunity, loss of bargain or diminution in the value of the Property.',
    ],
  },
  {
    id: 'complaints',
    heading: '11. Complaints and disputes',
    blocks: [
      `11.1 The Client should first raise any complaint with the Company on ${CONTACT_PHONE} or at ${CONTACT_EMAIL}. The Company will work with the Client to resolve it.`,
      '11.2 If the complaint is not resolved, the Client may contact Consumer Affairs Victoria or apply to the Victorian Civil and Administrative Tribunal (VCAT).',
    ],
  },
  {
    id: 'general',
    heading: '12. General',
    blocks: [
      '12.1 The Company handles the Client’s personal information in accordance with its privacy notice.',
      '12.2 This Agreement is governed by the laws of Victoria, Australia. The parties submit to the jurisdiction of the courts and tribunals of Victoria.',
      '12.3 This Agreement is the entire agreement between the parties concerning the Inspection.',
      '12.4 If any provision of this Agreement is invalid or unenforceable, it is severed and the remaining provisions continue in force.',
      '12.5 A failure or delay by the Company in exercising a right under this Agreement does not operate as a waiver of that right.',
      '12.6 The Company may amend this Agreement for future bookings. The version accepted by the Client applies to the Client’s Inspection.',
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
