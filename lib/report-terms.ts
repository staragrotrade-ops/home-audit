// Standard wording printed in every Home Audit inspection report: the scope
// statement near the front and the terms, definitions and limitations at the
// back. The inspector app downloads it from /api/app/catalog (and ships a
// copy), so wording changes reach reports without a new app release.
//
// It must agree with the Inspection Agreement the client accepted
// (lib/inspection-agreement.ts). It explains and repeats that agreement for
// the reader of the report; it does not add new obligations for the client.
// Where they differ, the agreement prevails (stated in the text).
//
// Sources: AS 4349.1-2007 (incl. Appendix C summary and Appendix B strata),
// AS 4349.3-2010, AS 3660.2, AS 2870 (crack categories), the National
// Construction Code, and the owner's previous report wording (2026-10-22),
// rewritten for the Australian Consumer Law and Victorian practice.
//
// Placeholders filled by the app: {company}, {acn}, {phone}, {email}.
import { COMPANY_ACN, COMPANY_NAME, CONTACT_EMAIL, CONTACT_PHONE } from './site.ts'

export const REPORT_TERMS_VERSION = '2026-10-26'

/** Which reports a block appears in. */
export type TermsScope = 'all' | 'building' | 'pest'

export type TermsBlock = { scope?: TermsScope; text?: string; list?: string[]; heading?: string }
export type TermsSection = { id: string; heading: string; scope: TermsScope; blocks: TermsBlock[] }

// --- Front of the report (after the summary) ------------------------------

export const REPORT_SCOPE_SECTIONS: TermsSection[] = [
  {
    id: 'scope',
    heading: 'Scope of this report',
    scope: 'all',
    blocks: [
      {
        scope: 'building',
        text: 'The building inspection was carried out in accordance with AS 4349.1-2007 Inspection of buildings, Part 1: Pre-purchase inspections – Residential buildings, and this report is set out in accordance with its Appendix C.',
      },
      {
        scope: 'pest',
        text: 'The timber pest inspection was carried out in accordance with AS 4349.3-2010 Inspection of buildings, Part 3: Timber pest inspections.',
      },
      {
        text: 'This report is subject to the Inspection Agreement that the Client accepted before the inspection. It explains the scope, exclusions and limitations of the inspection. If anything in this report appears to differ from that agreement, the agreement prevails. If you are unsure how it affects you, contact us before relying on this report.',
      },
      {
        text: 'This report is prepared only for the Client named above. No other person, including the vendor, an agent, another buyer or a lender, may rely on it. If this report has been passed to you by someone else, obtain your own inspection.',
      },
      {
        text: 'If the property is under strata, company title or an owners corporation, the inspection was limited to the interior and immediate exterior of the nominated residence (AS 4349.1 Appendix B). Common property was not inspected.',
      },
      {
        text: 'Special requirements: none, unless stated in this report. The scope of this inspection is the scope of the Inspection Agreement, unless stated in this report.',
      },
      { text: 'Please read the whole report, including the terms and limitations at the end. They form part of the report.' },
    ],
  },
  {
    id: 'areas',
    heading: 'Areas inspected and restrictions',
    scope: 'all',
    blocks: [
      {
        text: 'Where present and safely accessible, the inspection covered: (a) the interior of the building; (b) the roof space; (c) the exterior of the building; (d) the subfloor; (e) the roof exterior; and (f) the site within 30 metres of the main building and within the property boundaries, including fences and outbuildings.',
      },
      {
        scope: 'pest',
        text: 'For timber pests, the site within 50 metres of the building and within the property boundaries was inspected where safe access was available.',
      },
      {
        text: 'Visual inspection only. The inspection was limited to areas that were safely and reasonably accessible and visible on the day. Nothing was dismantled, moved or removed – including furniture, stored goods, floor and wall coverings, insulation, linings, panels and vegetation – and no invasive testing was carried out. Areas inside walls, between floors, behind stored goods and other concealed areas could not be seen. The "Areas inspected" section of this report lists each area, how far it could be inspected and why.',
      },
      {
        text: 'Important: where an area could not be inspected – for example a locked room, a sealed or screwed access panel, or low clearance – defects, timber pest activity or damage may be present but not seen. Ask the vendor to provide full access and arrange a further inspection of those areas before you commit to the purchase. We can re-attend once access is available, for a fee agreed with you beforehand.',
      },
    ],
  },
]

// --- Back of the report ------------------------------------------------------

export const REPORT_TERMS_SECTIONS: TermsSection[] = [
  {
    id: 'purpose',
    heading: '1. Purpose of the inspection',
    scope: 'all',
    blocks: [
      {
        scope: 'building',
        text: 'The purpose of a pre-purchase building inspection is to give the Client advice about the condition of the property on the inspection day: to identify major defects and safety hazards, and to give a general impression of the extent of minor defects. Individual minor defects need not be listed. This is a general appraisal, not a list of every fault, and another inspector may reach a different view.',
      },
      {
        scope: 'pest',
        text: 'The purpose of the timber pest inspection is to report visible evidence of subterranean termites, borers of seasoned timber and wood decay, and conditions conducive to timber pest attack, on the inspection day.',
      },
      {
        text: 'Acceptance criteria: the building is compared with a building of similar age and type that was built in accordance with the generally accepted practice at the time, and has been maintained without significant loss of strength or serviceability. It is not assessed against current regulations or standards and may not comply with them.',
      },
    ],
  },
  {
    id: 'definitions',
    heading: '2. Definitions used in this report',
    scope: 'all',
    blocks: [
      {
        list: [
          'Major defect – a defect of sufficient magnitude that rectification has to be carried out to avoid unsafe conditions, loss of function or further worsening of the defective item.',
          'Minor defect – a defect other than a major defect, such as a blemish, deterioration or maintenance item.',
          'Safety hazard – a defect that, in the inspector’s opinion, presents an unsafe condition. Safety hazards are reported in the same way as major defects.',
          'Further investigation recommended – the inspector saw evidence that needs assessment by a specialist (for example a structural engineer, electrician or plumber) before the condition can be determined.',
          'Accessible area – an area of the property to which safe and reasonable access was available within the scope of the inspection.',
          'Limitation – any factor that prevented full or proper inspection of an area or item.',
        ],
      },
      { heading: 'Overall condition of the building (AS 4349.1 Appendix C)' },
      {
        list: [
          'Above average – the overall condition is above that of similar buildings of about the same age and construction; most items are well maintained and show a reasonable standard of workmanship.',
          'Average – the overall condition is consistent with similar buildings of about the same age and construction; some areas or items need repair or maintenance.',
          'Below average – the building shows significant defects, poor workmanship, long-term neglect, or defects requiring major repair or reconstruction.',
        ],
      },
      { heading: 'Incidence of defects' },
      {
        list: [
          'High – the frequency and/or size of defects is above what the inspector would expect in similar, reasonably well maintained buildings of about the same age.',
          'Typical – consistent with what the inspector would expect in such buildings.',
          'Low – below what the inspector would expect in such buildings.',
        ],
      },
      {
        scope: 'pest',
        heading: 'Timber pest terms (AS 4349.3)',
      },
      {
        scope: 'pest',
        list: [
          'Active – live timber pests were present at the time of the inspection.',
          'Inactive – no live timber pests were present at the time of the inspection. Where inactive workings or damage are found, termites may still be active nearby; this cannot be determined without further inspections over time.',
          'Conducive conditions – conditions that make timber pest attack more likely, such as excess moisture, poor ventilation, timber in contact with soil, or a slab edge or weep holes covered by soil, paving or garden beds.',
          'Damage – minor: superficial, no repair needed; moderate: more than surface damage, timber repair or replacement likely; severe: the strength or serviceability of the timber may be impaired and it will usually need repair or replacement.',
        ],
      },
    ],
  },
  {
    id: 'access',
    heading: '3. Safe and reasonable access',
    scope: 'all',
    blocks: [
      {
        text: 'Only areas with safe and reasonable access were inspected. Access that needs a tool to open (screwed or fixed panels, hatches and covers, sealed or painted-shut openings, locks) is treated as not accessible. Reasonable access does not include cutting access holes, removing fastenings or sealants, or moving heavy furniture, floor coverings or stored goods. As a guide (AS 4349.1 and AS 4349.3):',
      },
      {
        list: [
          'Roof space – access hole at least 400 × 500 mm, crawl space at least 600 × 600 mm, reachable from a 3.6 m ladder.',
          'Subfloor – access hole at least 400 × 500 mm, at least 400 mm clearance below the lowest bearer, or 500 mm below the lowest concrete member.',
          'Roof exterior – safely viewable from a 3.6 m ladder placed on the ground.',
        ],
      },
      {
        text: 'Roof spaces with deep insulation, ducts or low clearance may be viewed from the hatch only. A roof is not walked on when it is too high, steep, wet or fragile to do so safely; this limits the inspection and defects may not be found.',
      },
    ],
  },
  {
    id: 'limitations',
    heading: '4. Limitations of a visual inspection',
    scope: 'all',
    blocks: [
      {
        text: 'Restricted areas. Where an area could only be partly inspected – because of furniture, stored goods, belongings in cupboards, floor coverings, insulation, ducts, low clearance, height or anything else – defects or timber pest activity may exist there undetected. We do not guarantee that there are, or are not, defects, termite damage or live termites in any area not inspected.',
      },
      {
        text: 'Concealed and weather-dependent defects. The report cannot comment on defects that were concealed (including by fresh paint, new coverings or furniture), or that only appear in certain weather or with use. A roof may leak only in heavy rain; a shower that is dry on the day may leak in normal use. Showers are tested, where water is connected, only by running water for a short time; recent sealant can hide a leak for months.',
      },
      {
        text: 'Windows and doors. Windows and doors that are stuck, painted shut or show decay are not forced. Binding may be seasonal or may relate to movement of the footings.',
      },
      {
        text: 'Cracking. A visual inspection cannot predict whether a crack will widen. That depends on the foundation material, the footing design, the site and the history of the crack, which are outside the scope of this inspection. Wall cracks are described using the categories of AS 2870: 0 – hairline, less than 0.1 mm; 1 – fine, less than 1 mm; 2 – noticeable, 1 to 5 mm; 3 – 5 to 15 mm, repair needed and weather-tightness may be affected; 4 – 15 to 25 mm, extensive repair needed. Where cracking is reported as more than minor, or where you are concerned about it, obtain advice from a structural engineer before purchase.',
      },
      {
        text: 'Floor levels. Floor levels are not measured as a matter of course. Using experience, the inspector takes readings only where a noticeable variation in floor level is seen, after allowing for factors that affect level such as construction tolerances, floor coverings, built-in fittings and the age of the building. Any readings and assessment are not a precise level survey; they are the inspector\'s judgement and advice at the time of inspection and must not be relied on as the only basis for a repair or purchase decision.',
      },
      {
        text: 'Elevated structures. Decks, balconies, verandahs, stairs and balustrades intended to carry people should be checked by an engineer or other suitably qualified person, and inspected regularly. This report does not assess whether any structure is suitable for a particular load or number of people. Balustrades and stairs in older homes may not meet the current National Construction Code.',
      },
      {
        text: 'Retaining walls and drainage. Retaining walls more than 700 mm high are inspected visually only; their design, drainage and load capacity are not assessed. Higher walls normally require engineering design. Comments on surface water drainage relate to conditions on the day; drainage may prove inadequate in heavy rain. Water should be directed away from the building. A drainage plumber can test drains (for example with a smoke or CCTV test).',
      },
      {
        text: 'Rooms below ground level may be affected by damp and water entry, particularly in heavy rain, and may not have been approved. Check approvals with the council.',
      },
      {
        text: 'Glass. Glazing in older homes may not meet the current safety glass standard (AS 1288). Consider safety glass or film in doors, low windows and other areas where people may impact the glass.',
      },
    ],
  },
  {
    id: 'not-covered',
    heading: '5. Not covered by this report',
    scope: 'all',
    blocks: [
      {
        text: 'As set out in the Inspection Agreement, the inspection does not cover: electrical installations and smoke alarms; plumbing, drains, gas, hot water, heating and cooling; appliances; swimming pools and spas (including pool barriers); asbestos, mould, lead and other health hazards; magnesite flooring; whether work was approved or complies with any law, permit or code; boundaries, title and other legal matters; engineering assessment of the structure, footings or soil; and the cost of repairs.',
      },
      {
        text: 'Asbestos: homes built before about 1990 may contain asbestos. Material that may contain asbestos may be noted where seen, but nothing is tested. Do not drill, cut or sand suspected material; use a licensed assessor.',
      },
      {
        text: 'Mould: mould may cause allergic or respiratory reactions in some people. If mould is noted and you are concerned, seek advice from a qualified hygienist or your doctor.',
      },
      {
        text: 'Recommended checks by licensed trades before purchase: an electrician (wiring, switchboard, safety switches and smoke alarms – smoke alarms to AS 3786 are required where people sleep); a plumber or gas fitter (plumbing, hot water and gas); and a pool safety inspector where there is a pool or spa. Trees close to the building can affect the footings as soil moisture changes.',
      },
      {
        text: 'No cost estimate. This report does not estimate the cost of repairs. Obtain quotations from licensed tradespeople before deciding to purchase. Any repair quotation service we may offer separately is not part of this report or the inspection.',
      },
    ],
  },
  {
    id: 'timber-pests',
    heading: '6. Timber pests',
    scope: 'pest',
    blocks: [
      {
        text: 'Concealed damage. Termite activity and damage can be concealed by wall and ceiling linings, insulation and other obstructions and may only be found during renovation or an invasive inspection. Where evidence of termites is reported – in the building, the grounds or fences – assume that concealed activity or damage may exist. Have a builder or other qualified person assess the extent of any damage; we do not assess repairs.',
      },
      {
        text: 'Invasive inspection. A more thorough, invasive inspection (moving insulation and stored goods, tapping and probing timbers, cutting access traps) is available by separate agreement with the owner’s written consent. It is recommended wherever evidence of timber pests is found.',
      },
      {
        text: 'Concrete slab homes. Termites can enter a slab home undetected over a concealed slab edge or through cracks. Keep at least 75 mm of the slab edge exposed and weep holes clear at all times; garden beds, paving or soil against the slab edge hide termite entry.',
      },
      {
        text: 'Subterranean termites are the most destructive timber pests in Australia. A colony may forage over a large area and enter a building from a nest well away from it. Unless written evidence of a current termite management system to AS 3660.2 is provided, a treatment or management program by a licensed pest manager should be considered.',
      },
      {
        text: 'Borers of seasoned timber are detected only by their emergence holes. Furniture beetle (Anobium) attacks softwood flooring and joinery over many years; powder post beetle (Lyctus) attacks only the sapwood of some hardwoods and is not normally structural. Where borer holes are reported, a pest manager should advise on treatment or replacement.',
      },
      {
        text: 'Wood decay (rot) is caused by fungi in damp timber. Minor decay may be cut out and filled; moderate or severe decay requires timber replacement and the moisture source to be fixed. Unpainted or poorly maintained external timber, such as Oregon, is particularly at risk.',
      },
      {
        text: 'Future inspections. AS 3660.2 recommends timber pest inspections at least every 12 months, and more often where the risk is higher. The recommended interval for this property is shown in the summary. Inspections do not prevent attack but find it earlier, when damage is less.',
      },
      {
        text: 'Degree of risk. The degree of risk of timber pest attack shown in the summary is the inspector’s judgement on the day, considering factors such as the surroundings, any evidence of timber pests, conducive conditions, inaccessible areas and the type of construction. A high rating is not meant to deter a purchase; it means extra vigilance and reducing conducive conditions are warranted.',
      },
    ],
  },
  {
    id: 'how-prepared',
    heading: '7. How this report was prepared',
    scope: 'all',
    blocks: [
      {
        text: 'Photographs show examples of what was seen; not every instance of a defect is photographed. Some photographs are marked up with arrows, circles or labels to show the item referred to.',
      },
      {
        text: 'Floorplans are taken from the property listing, provided by the Client or photographed on site. They are not to scale and may not match the building as built. Numbered markers show the approximate location of each defect; where a defect was seen in more than one place, each place is marked with the same number.',
      },
      {
        text: 'Quantities (for example the number of cracked tiles or metres of gutter) are the inspector’s visual estimate, given to help tradespeople prepare quotations. They are not a measured scope of works. The grouping of items by trade is a guide only; the right trade for a repair should be confirmed with the tradesperson.',
      },
      {
        text: 'Moisture meters and thermal imaging, where used, are aids to a visual inspection. A reading indicates conditions at that point at that time and is not a definitive diagnosis.',
      },
      {
        text: 'The inspector may use software, including speech-to-text and writing assistance, to record notes and prepare wording. Every finding, classification and recommendation in this report is the inspector’s own professional judgement and was reviewed by the inspector.',
      },
      {
        text: 'Each issued version of this report has a version number. A later version replaces earlier ones; rely only on the latest version you have received.',
      },
    ],
  },
  {
    id: 'reliance',
    heading: '8. Reliance, time and liability',
    scope: 'all',
    blocks: [
      {
        text: 'This report describes the property on the inspection day. Conditions change. If you sign a contract more than 30 days after the inspection, or if the property is affected by a storm, flood or other event before settlement, obtain a further inspection. The report must not be used by agents or others to market the property.',
      },
      {
        text: 'This report is advice only and is not a certificate of compliance, a warranty against future defects, insurance or a valuation. It should not be the only basis for deciding to purchase, negotiating the price or valuing the property. Also obtain advice from your lawyer or conveyancer and quotations from licensed tradespeople.',
      },
      {
        text: 'Our liability is as set out in clause 10 of the Inspection Agreement: limited to the inspection fee as far as the law allows. Nothing in this report or that agreement excludes, restricts or modifies your rights under the Australian Consumer Law or any other right that cannot lawfully be excluded.',
      },
    ],
  },
  {
    id: 'questions',
    heading: '9. Questions about this report',
    scope: 'all',
    blocks: [
      {
        text: 'Please contact the inspector if anything in this report is unclear – before signing a contract or letting a cooling-off, finance or building condition date pass. The inspection fee includes up to 15 minutes of telephone discussion about the report. Rely only on the written report; spoken comments on site or by phone are not part of our advice.',
      },
    ],
  },
]

const PLACEHOLDERS: Record<string, string> = {
  '{company}': COMPANY_NAME,
  '{acn}': COMPANY_ACN,
  '{phone}': CONTACT_PHONE,
  '{email}': CONTACT_EMAIL,
}

export function fillPlaceholders(text: string) {
  return Object.entries(PLACEHOLDERS).reduce((out, [key, value]) => out.split(key).join(value), text)
}

/** What /api/app/catalog sends: placeholders filled in. */
export function reportTermsPayload() {
  const fill = (sections: TermsSection[]) =>
    sections.map((section) => ({
      ...section,
      blocks: section.blocks.map((block) => ({
        ...block,
        text: block.text ? fillPlaceholders(block.text) : undefined,
        list: block.list?.map(fillPlaceholders),
      })),
    }))
  return { version: REPORT_TERMS_VERSION, scope: fill(REPORT_SCOPE_SECTIONS), terms: fill(REPORT_TERMS_SECTIONS) }
}

// --- Summary ratings (AS 4349.1 Appendix C, AS 4349.3) ----------------------

export const BUILDING_CONDITIONS = ['above_average', 'average', 'below_average'] as const
export const INCIDENCE = ['low', 'typical', 'high'] as const
export const PEST_RISK = ['low', 'moderate', 'high', 'extreme'] as const
export const FURTHER_INSPECTIONS = [
  'structural_engineer',
  'electrician',
  'plumber',
  'gas_fitter',
  'roofer',
  'drainer',
  'pest_manager',
  'asbestos_assessor',
  'pool_inspector',
  'arborist',
  'invasive_pest_inspection',
] as const
