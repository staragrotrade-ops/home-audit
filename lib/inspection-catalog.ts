// The building & pest inspection catalog: trades, inspected elements, which
// trade normally takes each element, and how a defect on it is quantified so a
// tradie can price it. The app downloads this from /api/app/catalog; the
// database stores only the keys. Change keys never; add new ones freely.

export const CATALOG_VERSION = 1

export const DEFECT_CATEGORIES = ['building', 'timber_pest'] as const
export type DefectCategory = (typeof DEFECT_CATEGORIES)[number]

// AS 4349.1 / AS 4349.3 wording. "conducive" = conditions conducive to timber
// pest attack.
export const SEVERITIES = [
  'major_defect',
  'minor_defect',
  'safety_hazard',
  'further_investigation',
  'active_termites',
  'termite_damage',
  'timber_pest_other',
  'conducive_condition',
] as const
export type Severity = (typeof SEVERITIES)[number]

export const SEVERITY_LABELS: Record<Severity, string> = {
  major_defect: 'Major defect',
  minor_defect: 'Minor defect',
  safety_hazard: 'Safety hazard',
  further_investigation: 'Further investigation recommended',
  active_termites: 'Active termites',
  termite_damage: 'Termite damage',
  timber_pest_other: 'Other timber pest (borer / decay)',
  conducive_condition: 'Condition conducive to timber pests',
}

export const SEVERITY_CATEGORY: Record<Severity, DefectCategory> = {
  major_defect: 'building',
  minor_defect: 'building',
  safety_hazard: 'building',
  further_investigation: 'building',
  active_termites: 'timber_pest',
  termite_damage: 'timber_pest',
  timber_pest_other: 'timber_pest',
  conducive_condition: 'timber_pest',
}

export const TRADES = [
  { key: 'roofer', label: 'Roofer / roof plumber' },
  { key: 'plumber', label: 'Plumber' },
  { key: 'drainer', label: 'Drainer' },
  { key: 'electrician', label: 'Electrician' },
  { key: 'carpenter', label: 'Carpenter' },
  { key: 'plasterer', label: 'Plasterer' },
  { key: 'painter', label: 'Painter' },
  { key: 'tiler', label: 'Tiler' },
  { key: 'waterproofer', label: 'Waterproofer' },
  { key: 'glazier', label: 'Glazier' },
  { key: 'bricklayer', label: 'Bricklayer' },
  { key: 'concreter', label: 'Concreter' },
  { key: 'fencer', label: 'Fencer / landscaper' },
  { key: 'pest_controller', label: 'Pest controller' },
  { key: 'hvac', label: 'Heating & cooling' },
  { key: 'builder', label: 'Builder (general)' },
  { key: 'structural_engineer', label: 'Structural engineer' },
] as const
export type TradeKey = (typeof TRADES)[number]['key']

export const AREA_GROUPS = [
  { key: 'roof_exterior', label: 'Roof exterior' },
  { key: 'roof_space', label: 'Roof space' },
  { key: 'exterior', label: 'Exterior' },
  { key: 'interior', label: 'Interior' },
  { key: 'wet_areas', label: 'Wet areas' },
  { key: 'subfloor', label: 'Subfloor' },
  { key: 'site', label: 'Site' },
] as const
export type AreaGroupKey = (typeof AREA_GROUPS)[number]['key']

// A quantity the inspector estimates so trades can price without a site visit.
export type QuantityMetric = { unit: string; label: string }

const COUNT = (unit: string, label: string): QuantityMetric => ({ unit, label })
const METRES: QuantityMetric = { unit: 'm', label: 'Approximate length (m)' }
const SQM: QuantityMetric = { unit: 'm2', label: 'Approximate area (m²)' }

export type CatalogElement = {
  key: string
  label: string
  area: AreaGroupKey
  trade: TradeKey
  quantity: QuantityMetric | null
}

export const ELEMENTS: readonly CatalogElement[] = [
  // Roof exterior — one roofer lead covers tiles, flashings, gutters and downpipes.
  { key: 'roof_tile', label: 'Roof tiles', area: 'roof_exterior', trade: 'roofer', quantity: COUNT('tiles', 'Number of tiles affected') },
  { key: 'ridge_capping', label: 'Ridge / hip capping', area: 'roof_exterior', trade: 'roofer', quantity: { unit: 'm', label: 'Length of capping affected (m)' } },
  { key: 'roof_sheet', label: 'Metal roof sheeting', area: 'roof_exterior', trade: 'roofer', quantity: COUNT('sheets', 'Number of sheets affected') },
  { key: 'flashing', label: 'Flashings', area: 'roof_exterior', trade: 'roofer', quantity: METRES },
  { key: 'gutter', label: 'Gutters', area: 'roof_exterior', trade: 'roofer', quantity: METRES },
  { key: 'downpipe', label: 'Downpipes', area: 'roof_exterior', trade: 'roofer', quantity: COUNT('downpipes', 'Number of downpipes') },
  { key: 'valley', label: 'Valley gutters', area: 'roof_exterior', trade: 'roofer', quantity: METRES },
  { key: 'fascia_eaves', label: 'Fascia / eaves', area: 'roof_exterior', trade: 'carpenter', quantity: METRES },
  // Roof space
  { key: 'roof_framing', label: 'Roof framing', area: 'roof_space', trade: 'carpenter', quantity: COUNT('members', 'Number of members affected') },
  { key: 'sarking', label: 'Sarking / insulation', area: 'roof_space', trade: 'builder', quantity: SQM },
  { key: 'roof_space_wiring', label: 'Roof space wiring', area: 'roof_space', trade: 'electrician', quantity: null },
  // Exterior
  { key: 'brickwork', label: 'Brickwork / masonry', area: 'exterior', trade: 'bricklayer', quantity: METRES },
  { key: 'cladding', label: 'Cladding', area: 'exterior', trade: 'carpenter', quantity: SQM },
  { key: 'window_external', label: 'Windows (external)', area: 'exterior', trade: 'glazier', quantity: COUNT('windows', 'Number of windows') },
  { key: 'external_door', label: 'External doors', area: 'exterior', trade: 'carpenter', quantity: COUNT('doors', 'Number of doors') },
  { key: 'deck_pergola', label: 'Deck / pergola / verandah', area: 'exterior', trade: 'carpenter', quantity: SQM },
  { key: 'balustrade', label: 'Balustrades / stairs', area: 'exterior', trade: 'carpenter', quantity: METRES },
  { key: 'external_paint', label: 'External paint', area: 'exterior', trade: 'painter', quantity: SQM },
  { key: 'weep_vents', label: 'Weep holes / subfloor vents', area: 'exterior', trade: 'bricklayer', quantity: COUNT('vents', 'Number affected') },
  // Interior
  { key: 'ceiling', label: 'Ceilings', area: 'interior', trade: 'plasterer', quantity: SQM },
  { key: 'internal_wall', label: 'Internal walls', area: 'interior', trade: 'plasterer', quantity: SQM },
  { key: 'floor', label: 'Floors / floor coverings', area: 'interior', trade: 'carpenter', quantity: SQM },
  { key: 'internal_door', label: 'Internal doors', area: 'interior', trade: 'carpenter', quantity: COUNT('doors', 'Number of doors') },
  { key: 'window_internal', label: 'Windows (internal)', area: 'interior', trade: 'glazier', quantity: COUNT('windows', 'Number of windows') },
  { key: 'cabinetry', label: 'Cabinetry / joinery', area: 'interior', trade: 'carpenter', quantity: null },
  { key: 'electrical_fitting', label: 'Electrical fittings', area: 'interior', trade: 'electrician', quantity: COUNT('items', 'Number of items') },
  { key: 'smoke_alarm', label: 'Smoke alarms', area: 'interior', trade: 'electrician', quantity: COUNT('alarms', 'Number of alarms') },
  { key: 'heating_cooling', label: 'Heating / cooling', area: 'interior', trade: 'hvac', quantity: null },
  // Wet areas
  { key: 'shower', label: 'Shower / screen', area: 'wet_areas', trade: 'waterproofer', quantity: null },
  { key: 'wet_area_tiling', label: 'Wet area tiling / grout / silicone', area: 'wet_areas', trade: 'tiler', quantity: SQM },
  { key: 'plumbing_fixture', label: 'Taps / basins / toilets', area: 'wet_areas', trade: 'plumber', quantity: COUNT('fixtures', 'Number of fixtures') },
  { key: 'hot_water', label: 'Hot water unit', area: 'wet_areas', trade: 'plumber', quantity: null },
  { key: 'wet_area_ventilation', label: 'Exhaust ventilation', area: 'wet_areas', trade: 'electrician', quantity: COUNT('fans', 'Number of fans') },
  // Subfloor
  { key: 'stumps', label: 'Stumps / piers', area: 'subfloor', trade: 'builder', quantity: COUNT('stumps', 'Number of stumps affected') },
  { key: 'bearers_joists', label: 'Bearers / joists', area: 'subfloor', trade: 'carpenter', quantity: COUNT('members', 'Number of members affected') },
  { key: 'subfloor_moisture', label: 'Subfloor moisture / ventilation', area: 'subfloor', trade: 'builder', quantity: null },
  { key: 'footings_slab', label: 'Footings / slab', area: 'subfloor', trade: 'structural_engineer', quantity: null },
  // Site
  { key: 'stormwater', label: 'Stormwater / surface drainage', area: 'site', trade: 'drainer', quantity: METRES },
  { key: 'paving_paths', label: 'Paths / driveway / paving', area: 'site', trade: 'concreter', quantity: SQM },
  { key: 'retaining_wall', label: 'Retaining walls', area: 'site', trade: 'builder', quantity: METRES },
  { key: 'fence', label: 'Fences / gates', area: 'site', trade: 'fencer', quantity: METRES },
  { key: 'outbuilding', label: 'Shed / garage / carport', area: 'site', trade: 'builder', quantity: null },
  // Timber pest — always routed to the pest controller.
  { key: 'termite_activity', label: 'Termite activity / damage', area: 'site', trade: 'pest_controller', quantity: null },
  { key: 'timber_decay', label: 'Wood decay / borer', area: 'site', trade: 'carpenter', quantity: COUNT('members', 'Number of members affected') },
  { key: 'other', label: 'Other', area: 'site', trade: 'builder', quantity: null },
]

const ELEMENT_BY_KEY = new Map(ELEMENTS.map((element) => [element.key, element]))
const TRADE_KEYS = new Set<string>(TRADES.map((trade) => trade.key))

export function elementOf(key: string) {
  return ELEMENT_BY_KEY.get(key) || null
}

export function isTradeKey(key: string): key is TradeKey {
  return TRADE_KEYS.has(key)
}

// The trade a defect is routed to: an inspector override wins, otherwise the
// element's default. Active termites always go to a pest controller first.
export function tradeFor(elementKey: string, severity: Severity, override?: string | null): TradeKey {
  if (override && isTradeKey(override)) return override
  if (severity === 'active_termites') return 'pest_controller'
  return elementOf(elementKey)?.trade || 'builder'
}

export function catalogPayload() {
  return {
    version: CATALOG_VERSION,
    categories: DEFECT_CATEGORIES,
    severities: SEVERITIES.map((key) => ({ key, label: SEVERITY_LABELS[key], category: SEVERITY_CATEGORY[key] })),
    trades: TRADES,
    areas: AREA_GROUPS,
    elements: ELEMENTS,
  }
}
