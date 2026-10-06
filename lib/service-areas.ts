export type ServiceAreaRegion =
  | 'Mornington Peninsula & Frankston'
  | 'Casey & Cardinia'

export type InspectionPriority = {
  title: string
  text: string
}

export type AreaFaq = {
  question: string
  answer: string
}

export type ServiceArea = {
  slug: string
  name: string
  postcode: string
  council: string
  region: ServiceAreaRegion
  serviceBalance: string
  metaTitle: string
  metaDescription: string
  hero: string
  summary: string
  localContext: readonly string[]
  priorities: readonly InspectionPriority[]
  existingHomeFit: string
  newHomeFit: string
  faqs: readonly AreaFaq[]
  nearby: readonly string[]
}

export const SERVICE_AREA_REGIONS: readonly ServiceAreaRegion[] = [
  'Mornington Peninsula & Frankston',
  'Casey & Cardinia',
]

export const SERVICE_AREAS: readonly ServiceArea[] = [
  {
    slug: 'mount-eliza',
    name: 'Mount Eliza',
    postcode: '3930',
    council: 'Mornington Peninsula Shire',
    region: 'Mornington Peninsula & Frankston',
    serviceBalance: 'Established homes, renovations and larger sites',
    metaTitle: 'Building & Pest Inspections Mount Eliza',
    metaDescription:
      'Independent building and pest inspections in Mount Eliza for established homes, renovated properties and new builds. Clear, photo-based reporting.',
    hero:
      'Independent pre-purchase, timber-pest and new-home inspections for Mount Eliza properties, with the scope matched to the dwelling and accessible site conditions.',
    summary:
      'Mount Eliza buyers often compare established homes that have changed over time through additions, updated wet areas, decks or landscaping. The useful question is not simply whether a home is old or new, but how the original structure, later work and site drainage perform together.',
    localContext: [
      'Mount Eliza includes a broad mix of established houses, renovated homes and newer replacement dwellings. Larger or sloping blocks can add retaining walls, external stairs, decks and more complex surface-water paths to the inspection scope.',
      'The bayside setting also makes the condition of roof drainage, external finishes and exposed timber worth recording carefully. These are observations about the individual property—not assumptions based on the suburb.',
    ],
    priorities: [
      {
        title: 'Sloping ground and drainage',
        text: 'Visible surface falls, stormwater discharge and moisture indicators near the building are considered where accessible.',
      },
      {
        title: 'Decks, balconies and retaining walls',
        text: 'Accessible supports, connections, deterioration and safety concerns are recorded as part of the visual inspection.',
      },
      {
        title: 'Alterations and mixed-age work',
        text: 'Transitions between original construction and later additions can help explain movement, moisture or finish differences.',
      },
      {
        title: 'Subfloor and timber-pest conditions',
        text: 'Where safe access exists, ventilation, dampness, timber contact and visible pest evidence are assessed.',
      },
    ],
    existingHomeFit:
      'A combined building and timber-pest inspection is generally the most useful starting point for an established Mount Eliza home, particularly where there are accessible subfloor areas, external timber or extensive landscaping.',
    newHomeFit:
      'For a new build or major replacement dwelling, inspections can be arranged at selected construction stages and again at practical completion before handover.',
    faqs: [
      {
        question: 'Do you inspect sloping properties in Mount Eliza?',
        answer:
          'Yes, where safe access is available. The inspection can record visible drainage, retaining, external stair, deck and building conditions, while clearly identifying inaccessible or specialist areas.',
      },
      {
        question: 'Should I add a timber-pest inspection?',
        answer:
          'It is often sensible for an established property. The decision should consider the building form, accessible timber, moisture conditions and surrounding site—not the suburb name alone.',
      },
      {
        question: 'Can you inspect before a Mount Eliza auction?',
        answer:
          'Yes, subject to access and availability. Include the auction date and agent contact in the quote request so timing can be assessed quickly.',
      },
    ],
    nearby: ['mornington', 'mount-martha', 'frankston', 'langwarrin'],
  },
  {
    slug: 'mornington',
    name: 'Mornington',
    postcode: '3931',
    council: 'Mornington Peninsula Shire',
    region: 'Mornington Peninsula & Frankston',
    serviceBalance: 'Established houses, units and infill development',
    metaTitle: 'Building & Pest Inspections Mornington',
    metaDescription:
      'Independent building and pest inspections in Mornington for houses, units, renovations and new homes. Practical findings and clear access limitations.',
    hero:
      'Independent inspections for Mornington houses, units and new builds—before purchase, auction, construction milestones or practical completion.',
    summary:
      'Mornington has established dwellings, renovated homes, units and newer infill construction. An inspection should respond to the actual age, building form and access available rather than apply one generic checklist to every property.',
    localContext: [
      'For older or renovated homes, roof drainage, wet areas, subfloor ventilation where present, and the junctions between original and later work can be important parts of the visual assessment.',
      'Units and compact infill sites may introduce different limits: shared property, close boundaries and occupied areas can restrict access. Those limits are recorded so the report does not imply that concealed or inaccessible areas were inspected.',
    ],
    priorities: [
      {
        title: 'Roof and stormwater',
        text: 'Accessible roof surfaces, gutters, downpipes and visible discharge points are reviewed for defects and moisture risk indicators.',
      },
      {
        title: 'Wet areas and internal moisture',
        text: 'Bathrooms, laundries and kitchens are checked visually, with moisture testing used where relevant and accessible.',
      },
      {
        title: 'Renovations and additions',
        text: 'Visible changes in construction, finishes and floor levels are noted where they may affect the condition assessment.',
      },
      {
        title: 'External timber and finishes',
        text: 'Accessible cladding, windows, decks and other exposed elements are checked for deterioration or maintenance concerns.',
      },
    ],
    existingHomeFit:
      'For a Mornington house or unit purchase, the pre-purchase scope records significant visible defects, moisture indicators, timber-pest evidence or risk factors and inspection limitations.',
    newHomeFit:
      'New dwellings and townhouses can be inspected at agreed stages, with practical completion focused on visible incomplete, defective or damaged work before handover.',
    faqs: [
      {
        question: 'Do you inspect units and townhouses in Mornington?',
        answer:
          'Yes. The report separates the areas that can be inspected from common property, occupied areas and other parts outside the agreed or accessible scope.',
      },
      {
        question: 'Can a renovated home still have defects?',
        answer:
          'Renovation can improve a property, but finishes can also conceal older construction. A visual inspection records the accessible condition and recommends further investigation where evidence warrants it.',
      },
      {
        question: 'How quickly can a pre-auction inspection be arranged?',
        answer:
          'It depends on access and availability. Provide the auction date, property address and agent details in the quote request so the deadline can be considered.',
      },
    ],
    nearby: ['mount-eliza', 'mount-martha', 'langwarrin', 'frankston'],
  },
  {
    slug: 'mount-martha',
    name: 'Mount Martha',
    postcode: '3934',
    council: 'Mornington Peninsula Shire',
    region: 'Mornington Peninsula & Frankston',
    serviceBalance: 'Established, split-level and coastal homes',
    metaTitle: 'Building & Pest Inspections Mount Martha',
    metaDescription:
      'Independent building and pest inspections in Mount Martha, including established, split-level and renovated homes plus new-home inspections.',
    hero:
      'Independent property inspections in Mount Martha, with particular care around accessible levels, external structures, drainage and weather-exposed elements.',
    summary:
      'Mount Martha properties can range from modest established dwellings to renovated, split-level and newer homes. The site and building layout often determine how much can be accessed and which observations matter most.',
    localContext: [
      'On sloping or stepped sites, retaining walls, elevated decks, external stairs and surface-water routes may sit close to the dwelling. Each element is inspected visually where safe and within scope.',
      'For properties exposed to coastal weather, the condition of accessible roof edges, external joinery, cladding and timber can be relevant. The report distinguishes visible defects from items that are primarily maintenance or require specialist assessment.',
    ],
    priorities: [
      {
        title: 'Levels and safe access',
        text: 'Split-level layouts, under-house areas and elevated external elements are assessed only where access is safe and practical.',
      },
      {
        title: 'Retaining and surface water',
        text: 'Visible wall condition, ground levels and drainage paths are recorded without presenting a visual inspection as engineering advice.',
      },
      {
        title: 'Decks and balconies',
        text: 'Accessible supports, fixings, balustrades and timber condition are reviewed for visible defects and safety concerns.',
      },
      {
        title: 'Weather-exposed elements',
        text: 'Roof drainage, windows, cladding and external timber receive attention where exposure or deterioration is visible.',
      },
    ],
    existingHomeFit:
      'A combined building and pest inspection suits many established Mount Martha purchases because it connects visible building condition, moisture and the factors that can make timber pests more likely.',
    newHomeFit:
      'For new construction, stage inspections can document accessible work before it is covered, followed by a PCI focused on the completed dwelling.',
    faqs: [
      {
        question: 'Are retaining walls included in a Mount Martha inspection?',
        answer:
          'Accessible retaining walls near the dwelling can be observed for visible condition and safety concerns. Structural adequacy, design certification and concealed drainage may require an engineer or other specialist.',
      },
      {
        question: 'Can you inspect an under-house area?',
        answer:
          'Yes when there is a suitable opening, adequate clearance and safe conditions. Restricted, obstructed or unsafe areas are identified as limitations in the report.',
      },
      {
        question: 'Is the roof always walked on?',
        answer:
          'No. Roof inspection method depends on height, pitch, material, condition, weather and safe access. The report states how the roof was viewed and any limitation.',
      },
    ],
    nearby: ['mornington', 'mount-eliza', 'frankston', 'langwarrin'],
  },
  {
    slug: 'frankston',
    name: 'Frankston',
    postcode: '3199',
    council: 'Frankston City Council',
    region: 'Mornington Peninsula & Frankston',
    serviceBalance: 'Mixed-age houses, units and townhouses',
    metaTitle: 'Building & Pest Inspections Frankston',
    metaDescription:
      'Independent building and pest inspections in Frankston for houses, units and townhouses, including pre-purchase, pre-auction and new-home inspections.',
    hero:
      'Independent building, timber-pest and new-home inspections across Frankston’s mix of established houses, units, renovated properties and newer development.',
    summary:
      'Frankston’s varied housing means two nearby properties may need quite different inspection attention. Building age, raised or slab construction, renovation history, shared property and available access all shape the scope.',
    localContext: [
      'An established detached home may provide roof-space or subfloor access, while a unit or townhouse may have shared walls, common property and tighter external boundaries. The report records what was accessible on the day.',
      'Where a dwelling has been updated, visible junctions between old and new work, altered wet areas, roof changes and external drainage can be more informative than appearance alone.',
    ],
    priorities: [
      {
        title: 'Building age and construction type',
        text: 'Inspection priorities are adjusted for raised floors, concrete slabs, masonry, lightweight cladding and mixed construction where visible.',
      },
      {
        title: 'Moisture and wet areas',
        text: 'Visible staining, ventilation, sealant condition and relevant moisture readings are considered in accessible internal areas.',
      },
      {
        title: 'Roof space or subfloor access',
        text: 'These areas can add useful evidence when openings, clearance, safety and the property arrangement allow entry.',
      },
      {
        title: 'Units and shared property',
        text: 'Private-lot observations are separated from inaccessible or out-of-scope owners-corporation areas.',
      },
    ],
    existingHomeFit:
      'Pre-purchase and pre-auction inspections are suitable for Frankston houses, units and townhouses. The quote should identify the property type so access expectations and scope are clear.',
    newHomeFit:
      'For a new townhouse or detached home, choose a stage inspection before work is concealed or a practical completion inspection as handover approaches.',
    faqs: [
      {
        question: 'Do you inspect Frankston apartments or units?',
        answer:
          'Units and townhouses can be inspected, subject to the agreed scope and access. Common property, neighbouring lots and locked shared areas may sit outside a standard private-lot inspection.',
      },
      {
        question: 'Is a building and pest inspection useful for a newer home?',
        answer:
          'Yes. Age alone does not establish condition. The inspection records accessible visible defects, moisture indicators, pest evidence or risk factors and relevant limitations.',
      },
      {
        question: 'Can you coordinate access with the selling agent?',
        answer:
          'Yes. Add the agent or access contact to the quote request, together with any contract or auction deadline.',
      },
    ],
    nearby: ['mount-eliza', 'langwarrin', 'carrum-downs', 'mornington'],
  },
  {
    slug: 'langwarrin',
    name: 'Langwarrin',
    postcode: '3910',
    council: 'Frankston City Council',
    region: 'Mornington Peninsula & Frankston',
    serviceBalance: 'Family homes, additions and landscaped sites',
    metaTitle: 'Building & Pest Inspections Langwarrin',
    metaDescription:
      'Independent building and pest inspections in Langwarrin for family homes, additions and new builds. Pre-purchase, pre-auction and stage inspections.',
    hero:
      'Independent inspections for established and new homes in Langwarrin, with visible building condition, moisture, timber-pest risk and site factors considered together.',
    summary:
      'Langwarrin homes commonly present as detached family properties, but construction age, extensions, outdoor structures and landscaping can vary substantially. A useful inspection follows those differences instead of relying on a suburb-wide assumption.',
    localContext: [
      'Pergolas, decks, garages and later additions can create extra roof junctions and timber-to-ground or moisture-prone areas. Where accessible, the inspection considers how these elements meet the original dwelling.',
      'Established gardens and stored items can restrict perimeter or subfloor access. The report calls out those limitations and any conditions that may warrant clearer access or further investigation.',
    ],
    priorities: [
      {
        title: 'Additions and outdoor structures',
        text: 'Visible connections, roof junctions, supports and drainage around extensions, decks and pergolas are reviewed within scope.',
      },
      {
        title: 'Termite-conducive conditions',
        text: 'Accessible timber contact, damp areas, stored materials and restricted ventilation are noted where relevant.',
      },
      {
        title: 'Roof and gutter discharge',
        text: 'Visible roof condition and the way downpipes discharge near the dwelling are considered as part of the moisture assessment.',
      },
      {
        title: 'Slab and raised-floor homes',
        text: 'The inspection method responds to the construction type and records where floor, subfloor or perimeter visibility is limited.',
      },
    ],
    existingHomeFit:
      'For an established Langwarrin home, combining the building and timber-pest scopes creates a clearer picture of visible condition, moisture and pest-conducive site factors.',
    newHomeFit:
      'New-home stage and PCI inspections are also available when the builder confirms the site is ready and safe for the agreed inspection point.',
    faqs: [
      {
        question: 'Are sheds and pergolas included?',
        answer:
          'Minor structures can be observed when they are within the agreed scope and safely accessible. Large, specialised or separately occupied structures should be identified when requesting the quote.',
      },
      {
        question: 'What if stored items block access?',
        answer:
          'The inspection is non-invasive and personal possessions are not broadly moved. Obstructed areas are recorded as limitations, and clearer access may be recommended if the risk justifies it.',
      },
      {
        question: 'Can I book building-only rather than building and pest?',
        answer:
          'Yes, depending on your needs. The quote flow allows the requested service to be identified, while the scope and limitations are confirmed before booking.',
      },
    ],
    nearby: ['frankston', 'carrum-downs', 'mount-eliza', 'cranbourne'],
  },
  {
    slug: 'carrum-downs',
    name: 'Carrum Downs',
    postcode: '3201',
    council: 'Frankston City Council',
    region: 'Mornington Peninsula & Frankston',
    serviceBalance: 'Later suburban homes, units and compact sites',
    metaTitle: 'Building & Pest Inspections Carrum Downs',
    metaDescription:
      'Independent building and pest inspections in Carrum Downs for houses, units and new homes, with clear reporting on defects, moisture and access.',
    hero:
      'Independent pre-purchase and new-home inspections in Carrum Downs for detached houses, units and townhouses on established or recently completed sites.',
    summary:
      'Many Carrum Downs properties use relatively modern suburban forms, including slab-on-ground dwellings, compact lots and townhouse development. Newer appearance does not remove the need to check accessible construction and drainage carefully.',
    localContext: [
      'On compact sites, fences, landscaping, stored items and close neighbouring walls may limit external access. The report states those limits rather than treating an unseen area as defect-free.',
      'For slab homes, perimeter visibility, finished ground levels and stormwater paths can be useful evidence. Inside, wet areas, ceiling spaces where accessible and visible cracking or moisture indicators remain important.',
    ],
    priorities: [
      {
        title: 'Slab perimeter and ground levels',
        text: 'Visible edges, adjacent paving, garden levels and water paths are considered where the boundary layout allows access.',
      },
      {
        title: 'Compact-site drainage',
        text: 'Downpipes, surface falls and areas where water may collect near the dwelling are recorded when visible.',
      },
      {
        title: 'Wet areas and roof space',
        text: 'Accessible bathrooms, laundry areas and ceiling spaces are checked for visible defects and moisture indicators.',
      },
      {
        title: 'Boundary access',
        text: 'Narrow, locked or obstructed sides are documented clearly because they can prevent inspection of external walls and services.',
      },
    ],
    existingHomeFit:
      'A building and pest inspection is appropriate before purchasing a Carrum Downs house, unit or townhouse, with the property type declared so shared and inaccessible areas can be handled correctly.',
    newHomeFit:
      'For a newly built dwelling, frame, pre-plaster and practical completion inspections provide different opportunities to see work before or after finishes are installed.',
    faqs: [
      {
        question: 'Does a relatively new Carrum Downs home still need inspection?',
        answer:
          'It can still benefit from one. A pre-purchase inspection assesses the visible condition at the time; a new-home PCI focuses on incomplete, defective or damaged work before handover.',
      },
      {
        question: 'Can narrow side access be inspected?',
        answer:
          'Only where it is safe and physically accessible. Locked gates, very tight clearances, vegetation and stored items are reported as limitations.',
      },
      {
        question: 'Which service should I choose for a recently completed home?',
        answer:
          'If you are the building owner approaching handover, a practical completion inspection is usually the closer fit. If you are buying an already completed property, request a pre-purchase scope.',
      },
    ],
    nearby: ['langwarrin', 'frankston', 'cranbourne', 'narre-warren'],
  },
  {
    slug: 'berwick',
    name: 'Berwick',
    postcode: '3806',
    council: 'City of Casey',
    region: 'Casey & Cardinia',
    serviceBalance: 'Established homes, estate housing and sloping sites',
    metaTitle: 'Building & Pest Inspections Berwick',
    metaDescription:
      'Independent building and pest inspections in Berwick for established homes, estate properties and new builds, including stage inspections and PCI.',
    hero:
      'Independent inspections for Berwick’s established homes and newer estate properties, from pre-purchase due diligence to construction stages and handover.',
    summary:
      'Berwick combines established neighbourhoods with newer estate housing, so property age and site form can change within a short distance. Inspection priorities may range from subfloor and renovation history to slab edges, retaining and new-build workmanship.',
    localContext: [
      'Some properties sit on sloping or terraced sites where retaining walls, surface-water management, elevated outdoor areas and stepped access add to the visual scope.',
      'In established homes, later extensions and refurbished wet areas can be as relevant as original construction. In newer homes, the focus may shift toward visible completion, finishes and how site works meet the dwelling.',
    ],
    priorities: [
      {
        title: 'Retaining and site levels',
        text: 'Accessible walls, ground levels and drainage near the home are observed, with specialist assessment recommended when required.',
      },
      {
        title: 'Established-home alterations',
        text: 'Visible additions, roof junctions and changes in materials or levels are considered when assessing condition.',
      },
      {
        title: 'Moisture and timber-pest risk',
        text: 'Building defects and pest-conducive conditions are considered together in accessible areas.',
      },
      {
        title: 'New-build completion',
        text: 'PCI observations focus on visible incomplete, defective or damaged work present at the agreed inspection time.',
      },
    ],
    existingHomeFit:
      'For an established Berwick property, pre-purchase building and timber-pest scopes help connect site, moisture, structure and accessible timber observations before commitment.',
    newHomeFit:
      'For estate construction, arrange inspections at selected stages while work is accessible, or book a practical completion inspection when the builder declares the home ready.',
    faqs: [
      {
        question: 'Do you inspect both old and new homes in Berwick?',
        answer:
          'Yes. Existing-home and new-construction inspections have different scopes, so the quote request should identify whether you are buying an established property or building with a builder.',
      },
      {
        question: 'Are retaining walls structurally certified by the inspection?',
        answer:
          'No. Visible condition and concerns can be recorded, but design adequacy, concealed drainage and structural certification require the appropriate engineer or documentation.',
      },
      {
        question: 'Can you inspect before an auction?',
        answer:
          'Yes, subject to seller access and availability. Provide the auction date when requesting a quote.',
      },
    ],
    nearby: ['narre-warren', 'officer', 'cranbourne', 'pakenham'],
  },
  {
    slug: 'cranbourne',
    name: 'Cranbourne',
    postcode: '3977',
    council: 'City of Casey',
    region: 'Casey & Cardinia',
    serviceBalance: 'Established purchases and expanding new-home areas',
    metaTitle: 'Building & New Home Inspections Cranbourne',
    metaDescription:
      'Independent building, pest and new-home inspections in Cranbourne, including pre-purchase, construction stage and practical completion inspections.',
    hero:
      'Independent building and new-home inspections in Cranbourne, covering established purchases, active construction stages and practical completion.',
    summary:
      'Cranbourne includes established housing alongside substantial newer residential development. That makes it important to choose the inspection by the property’s actual stage: pre-purchase for a completed sale, or a construction-stage and PCI scope when you are building.',
    localContext: [
      'For established homes, roof drainage, wet areas, visible movement, accessible roof or subfloor areas and timber-pest conditions can all contribute to the overall risk picture.',
      'For new builds, timing matters. Frame and pre-plaster inspections provide access before later work conceals components; practical completion records visible issues once the home is presented for handover.',
    ],
    priorities: [
      {
        title: 'Match scope to property stage',
        text: 'A resale, active build and handover each require a different inspection purpose, timing and report structure.',
      },
      {
        title: 'Site drainage and finished levels',
        text: 'Visible falls, stormwater discharge and ground levels around the home are reviewed where site work is complete and accessible.',
      },
      {
        title: 'Wet areas and roof drainage',
        text: 'Accessible bathrooms, laundries, gutters and downpipes are checked for visible defects or moisture-related indicators.',
      },
      {
        title: 'Incomplete new-home work',
        text: 'At PCI, visible incomplete, damaged or defective items are documented before the contractual handover process continues.',
      },
    ],
    existingHomeFit:
      'Choose building and pest for an established Cranbourne property or a recently completed home being resold. Access, age and any additions should be included in the quote details.',
    newHomeFit:
      'Choose new-home inspections when you are the building owner and can arrange builder access at slab, frame, pre-plaster, fixing or practical completion.',
    faqs: [
      {
        question: 'Is PCI the same as a pre-purchase inspection?',
        answer:
          'No. PCI is for a new home presented near handover and focuses on visible completion and defects. A pre-purchase inspection supports a buyer assessing an already completed property.',
      },
      {
        question: 'Can I book only one construction stage?',
        answer:
          'Yes. You can request one stage or a sequence of inspections. The most useful next stage depends on where construction has reached.',
      },
      {
        question: 'Do you service areas around Cranbourne as well?',
        answer:
          'Yes, subject to scheduling and the specific address. Nearby priority areas include Clyde North, Berwick, Narre Warren and Carrum Downs.',
      },
    ],
    nearby: ['clyde-north', 'berwick', 'narre-warren', 'carrum-downs'],
  },
  {
    slug: 'clyde-north',
    name: 'Clyde North',
    postcode: '3978',
    council: 'City of Casey',
    region: 'Casey & Cardinia',
    serviceBalance: 'New-home stages, handover and recent resales',
    metaTitle: 'New Home & Building Inspections Clyde North',
    metaDescription:
      'Independent new-home stage, PCI and pre-purchase building inspections in Clyde North. Clear reports for active builds and recently completed homes.',
    hero:
      'Independent stage and practical completion inspections for Clyde North new builds, plus pre-purchase inspections for completed and resold homes.',
    summary:
      'Clyde North is a priority new-home area, so the inspection opportunity is often defined by the build programme. Booking before a stage is covered gives a different view from waiting until practical completion.',
    localContext: [
      'At frame or pre-plaster, accessible construction can be observed before linings and finishes conceal it. At practical completion, the focus moves to visible incomplete, defective or damaged work and the condition presented for handover.',
      'Completed homes sold by an owner require a pre-purchase scope rather than a construction-stage inspection. That distinction keeps the report aligned with the client’s role, access and decision.',
    ],
    priorities: [
      {
        title: 'Stage readiness',
        text: 'The builder should confirm the nominated stage is complete enough, accessible and safe before the inspection is scheduled.',
      },
      {
        title: 'Work before concealment',
        text: 'Frame and pre-plaster stages provide a time-limited opportunity to view accessible work before wall and ceiling linings proceed.',
      },
      {
        title: 'Practical completion',
        text: 'Visible incomplete, defective and damaged items are recorded when the home is presented as ready for PCI.',
      },
      {
        title: 'Drainage and final site work',
        text: 'Where completed, visible external levels, falls and stormwater discharge are considered in relation to the dwelling.',
      },
    ],
    existingHomeFit:
      'If the Clyde North home is complete and being sold to you, a pre-purchase building and pest inspection is the correct pathway—even if the dwelling is relatively recent.',
    newHomeFit:
      'If you hold the building contract, select the next available construction stage or PCI. Earlier inspection is valuable because later finishes can conceal work.',
    faqs: [
      {
        question: 'Which new-home stage is best in Clyde North?',
        answer:
          'There is no single best stage. Frame and pre-plaster provide access before concealment, while PCI assesses visible completion before handover. Multiple stages provide separate checkpoints.',
      },
      {
        question: 'When should I contact the inspector?',
        answer:
          'Contact Home Audit before the builder’s expected inspection-ready date. Provide the site address, builder, stage and estimated timing so availability can be checked.',
      },
      {
        question: 'Can you inspect a near-new resale?',
        answer:
          'Yes. A completed home being purchased from an owner is treated as a pre-purchase inspection rather than a builder-stage inspection.',
      },
    ],
    nearby: ['cranbourne', 'berwick', 'officer', 'narre-warren'],
  },
  {
    slug: 'officer',
    name: 'Officer',
    postcode: '3809',
    council: 'Cardinia Shire Council',
    region: 'Casey & Cardinia',
    serviceBalance: 'New estates, stage inspections and PCI',
    metaTitle: 'New Home & Building Inspections Officer',
    metaDescription:
      'Independent new-home, stage and practical completion inspections in Officer, plus building and pest inspections for completed properties.',
    hero:
      'Independent new-home inspections in Officer from frame and pre-plaster through to practical completion, plus due diligence for completed homes.',
    summary:
      'Officer’s continuing residential development makes construction timing especially relevant. The earlier an agreed inspection occurs before work is concealed, the more directly it can describe visible conditions at that stage.',
    localContext: [
      'New dwellings may still involve sloping sites, retaining, stepped lots or unfinished external works. These factors affect access and what can reasonably be observed at each stage.',
      'A practical completion inspection is not a substitute for earlier stage checks: it assesses the visible finished home. Conversely, an early-stage report cannot anticipate every later finish or completion item.',
    ],
    priorities: [
      {
        title: 'Frame and pre-plaster access',
        text: 'Accessible framing and service penetrations can be reviewed before they are progressively concealed.',
      },
      {
        title: 'Site levels and retaining',
        text: 'Visible site conditions are documented at the stage they are complete enough to assess, without replacing engineering advice.',
      },
      {
        title: 'Handover condition',
        text: 'PCI records visible incomplete, defective or damaged work present when the builder makes the home available.',
      },
      {
        title: 'Scope by readiness',
        text: 'The report identifies areas that remain unfinished, locked, concealed or unsafe so the limits are not mistaken for approval.',
      },
    ],
    existingHomeFit:
      'For a completed Officer home offered for sale, choose a pre-purchase inspection. Newer age does not guarantee that all accessible work is defect-free.',
    newHomeFit:
      'For an active build, provide the builder’s expected stage date and contact details. Home Audit can quote one stage or a planned sequence through PCI.',
    faqs: [
      {
        question: 'Can you inspect if external works are unfinished?',
        answer:
          'Yes, but unfinished landscaping, paving, drainage or access will be recorded as a limitation. A later inspection may be needed if those items are material to your handover decision.',
      },
      {
        question: 'Does a stage inspection delay the builder?',
        answer:
          'It needs to be coordinated with the builder’s programme. Booking early and confirming the inspection-ready point helps minimise disruption.',
      },
      {
        question: 'Do I need both pre-plaster and PCI?',
        answer:
          'They answer different questions. Pre-plaster observes accessible work before linings; PCI observes the finished home. Whether to book both depends on timing and your preferred level of independent checking.',
      },
    ],
    nearby: ['berwick', 'pakenham', 'clyde-north', 'narre-warren'],
  },
  {
    slug: 'pakenham',
    name: 'Pakenham',
    postcode: '3810',
    council: 'Cardinia Shire Council',
    region: 'Casey & Cardinia',
    serviceBalance: 'Established homes and active growth-area construction',
    metaTitle: 'Building & New Home Inspections Pakenham',
    metaDescription:
      'Independent building, pest and new-home inspections in Pakenham for established purchases, construction stages and practical completion.',
    hero:
      'Independent building and new-home inspections across Pakenham, from established property purchases to active construction and handover.',
    summary:
      'Pakenham contains both established neighbourhoods and expanding residential areas. That creates two strong inspection needs: due diligence on completed homes and independent checkpoints during a new build.',
    localContext: [
      'For an established purchase, the building form, age, renovations, moisture indicators and accessible roof or subfloor areas guide the inspection. The timber-pest scope adds evidence about visible activity and conducive conditions.',
      'For newer estates, site drainage, retaining, slab perimeter visibility and completion of external works can be relevant alongside the condition of the house itself, depending on the construction stage.',
    ],
    priorities: [
      {
        title: 'Established versus active build',
        text: 'The inspection pathway is selected by contract and construction status, not simply by how recently the home was built.',
      },
      {
        title: 'Visible drainage and site work',
        text: 'Completed falls, ground levels, stormwater discharge and retaining are observed where accessible and within scope.',
      },
      {
        title: 'Roof, wet areas and moisture',
        text: 'Accessible building elements are checked for visible defects, staining, dampness and relevant risk indicators.',
      },
      {
        title: 'Construction-stage timing',
        text: 'Frame, pre-plaster, fixing and PCI each offer a different view as work is progressively concealed and completed.',
      },
    ],
    existingHomeFit:
      'Choose building and pest when buying a completed Pakenham property. The report brings visible building defects, moisture, pest evidence or risk factors and access limitations into one record.',
    newHomeFit:
      'Choose a new-home stage inspection when you are building and can arrange site access through the builder, or PCI when the dwelling is declared ready for handover review.',
    faqs: [
      {
        question: 'Do you inspect both established and new Pakenham homes?',
        answer:
          'Yes. The service and report differ by property status: pre-purchase for a completed sale, or stage and practical completion inspections under a building contract.',
      },
      {
        question: 'Can external drainage be checked before it is finished?',
        answer:
          'Only the visible work present on the day can be recorded. Unfinished paving, landscaping, downpipe connections or site levels are identified as incomplete or limited.',
      },
      {
        question: 'How do I arrange builder access?',
        answer:
          'Provide the builder or site supervisor contact, nominated stage and expected ready date. Access requirements should be agreed with the builder before attendance.',
      },
    ],
    nearby: ['officer', 'berwick', 'clyde-north', 'narre-warren'],
  },
  {
    slug: 'narre-warren',
    name: 'Narre Warren',
    postcode: '3805',
    council: 'City of Casey',
    region: 'Casey & Cardinia',
    serviceBalance: 'Established family homes, additions and resales',
    metaTitle: 'Building & Pest Inspections Narre Warren',
    metaDescription:
      'Independent building and pest inspections in Narre Warren for established houses, renovations and townhouses, plus new-home and PCI services.',
    hero:
      'Independent pre-purchase, building and timber-pest inspections in Narre Warren, with new-home stage and PCI services also available.',
    summary:
      'Narre Warren is primarily an established-home opportunity within the first service-area group. Family houses may include later wet-area updates, extensions, pergolas or decks that should be considered with the original construction.',
    localContext: [
      'The inspection follows the dwelling’s construction type and accessible areas. Raised-floor homes may offer subfloor evidence; slab homes rely more on visible perimeter, internal and roof-space observations.',
      'Renovated finishes can change appearance without revealing what is concealed. Visible junctions, moisture indicators, floor levels, roof changes and documentation questions can help identify where further investigation is sensible.',
    ],
    priorities: [
      {
        title: 'Original and altered work',
        text: 'Visible material changes, additions and roof junctions are considered when building history appears mixed.',
      },
      {
        title: 'Subfloor or slab observations',
        text: 'The inspection adapts to the construction type and clearly records unavailable or obstructed access.',
      },
      {
        title: 'Wet areas and internal finishes',
        text: 'Accessible bathrooms, laundry areas, ceilings and floors are checked for visible defects and moisture indicators.',
      },
      {
        title: 'Pergolas, decks and external timber',
        text: 'Accessible supports, connections, deterioration and timber-pest conditions are observed within the agreed scope.',
      },
    ],
    existingHomeFit:
      'A combined building and timber-pest inspection is a strong fit for many Narre Warren resales, particularly where additions, external timber or accessible underfloor areas are present.',
    newHomeFit:
      'New or recently completed dwellings can be inspected at construction stages or PCI when you hold the building contract; completed resales use the pre-purchase pathway.',
    faqs: [
      {
        question: 'Can you tell whether an extension was approved?',
        answer:
          'A visual inspection may identify construction differences, but it does not prove permits or approvals. Those records should be checked with the vendor, conveyancer and relevant authority.',
      },
      {
        question: 'Will the inspector enter the roof space and subfloor?',
        answer:
          'Where suitable openings, clearance, visibility and safe conditions allow. The report identifies any area that could not be entered or fully viewed.',
      },
      {
        question: 'Is timber-pest inspection separate?',
        answer:
          'It is a distinct scope that can be combined with the building inspection. Combining them helps relate moisture and building conditions to timber-pest evidence and risk factors.',
      },
    ],
    nearby: ['berwick', 'cranbourne', 'clyde-north', 'carrum-downs'],
  },
]

export const SERVICE_AREA_SLUGS = SERVICE_AREAS.map((area) => area.slug)

export function getServiceArea(slug: string) {
  return SERVICE_AREAS.find((area) => area.slug === slug)
}

export function getNearbyServiceAreas(area: ServiceArea) {
  return area.nearby
    .map((slug) => getServiceArea(slug))
    .filter((nearbyArea): nearbyArea is ServiceArea => Boolean(nearbyArea))
}

