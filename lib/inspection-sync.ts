// Validation for what the inspector app sends when it syncs captured
// inspection data. The database re-checks everything; this gives the phone a
// clear message first and fills in derived fields (category, trade).
import { z } from 'zod'
import { BUILDING_CONDITIONS, FURTHER_INSPECTIONS, INCIDENCE, PEST_RISK } from './report-terms.ts'
import { SEVERITIES, SEVERITY_CATEGORY, elementOf, isTradeKey, tradeFor } from './inspection-catalog.ts'

export const PHOTO_BUCKET = 'inspection-photos'
export const PHOTO_MAX_BYTES = 15 * 1024 * 1024
export const DEFECT_BATCH_MAX = 200

const key = z.string().regex(/^[a-z0-9_]{2,40}$/)
const coordinate = z.number().min(0).max(1)
// Phones use the creation time in seconds as the order of a new defect, so
// allow the whole database integer range.
export const SORT_ORDER_MAX = 2_147_483_647
export const EXTRA_PINS_MAX = 50

// Further locations of the same defect (e.g. the same crack in three rooms).
// Most defects have none; the first location stays in floorplanId/pinX/pinY.
const extraPin = z.object({ floorplanId: z.uuid(), x: coordinate, y: coordinate })

export const defectInput = z
  .object({
    id: z.uuid(),
    floorplanId: z.uuid().nullable().optional(),
    pinX: coordinate.nullable().optional(),
    pinY: coordinate.nullable().optional(),
    extraPins: z.array(extraPin).max(EXTRA_PINS_MAX).optional(),
    locationLabel: z.string().trim().max(120).nullable().optional(),
    elementKey: key,
    severity: z.enum(SEVERITIES),
    title: z.string().trim().min(1).max(160),
    observation: z.string().max(4000).default(''),
    recommendation: z.string().max(2000).nullable().optional(),
    tradeKey: key.nullable().optional(),
    quantity: z.number().min(0).max(99_999_999).nullable().optional(),
    quantityUnit: z.string().trim().max(20).nullable().optional(),
    rootCauseId: z.uuid().nullable().optional(),
    templateId: z.uuid().nullable().optional(),
    sortOrder: z.number().int().min(0).max(SORT_ORDER_MAX).optional(),
    deleted: z.boolean().optional(),
    clientUpdatedAt: z.iso.datetime({ offset: true }),
  })
  .superRefine((value, ctx) => {
    const hasX = value.pinX != null
    const hasY = value.pinY != null
    if (hasX !== hasY) ctx.addIssue({ code: 'custom', message: 'A pin needs both x and y.' })
    if (hasX && !value.floorplanId) ctx.addIssue({ code: 'custom', message: 'A pin needs its floorplan.' })
    if (value.extraPins?.length && !hasX) {
      ctx.addIssue({ code: 'custom', message: 'Extra locations need a first location.' })
    }
    if (value.rootCauseId && value.rootCauseId === value.id) {
      ctx.addIssue({ code: 'custom', message: 'A defect cannot be its own cause.' })
    }
    if (value.quantity != null && !value.quantityUnit && !elementOf(value.elementKey)?.quantity) {
      ctx.addIssue({ code: 'custom', message: 'Give a unit for the quantity.' })
    }
    if (value.tradeKey && !isTradeKey(value.tradeKey)) {
      ctx.addIssue({ code: 'custom', message: `Unknown trade "${value.tradeKey}".` })
    }
    if (Date.parse(value.clientUpdatedAt) > Date.now() + 10 * 60_000) {
      ctx.addIssue({ code: 'custom', message: 'The phone clock is ahead; check the date and time settings.' })
    }
  })

export type DefectInput = z.infer<typeof defectInput>

export const defectBatch = z.object({
  defects: z.array(defectInput).max(DEFECT_BATCH_MAX),
})

// What is stored: category follows the severity; the trade is the
// inspector's choice or the element's default; the unit defaults to the
// element's quantity metric.
export function normaliseDefect(input: DefectInput) {
  const element = elementOf(input.elementKey)
  return {
    ...input,
    category: SEVERITY_CATEGORY[input.severity],
    tradeKey: tradeFor(input.elementKey, input.severity, input.tradeKey),
    quantityUnit: input.quantity == null ? null : input.quantityUnit || element?.quantity?.unit || null,
    locationLabel: input.locationLabel || null,
    recommendation: input.recommendation || null,
    extraPins: input.extraPins ?? [],
    pinX: input.pinX ?? null,
    pinY: input.pinY ?? null,
    floorplanId: input.floorplanId ?? null,
  }
}

// Root links inside one batch must not form chains (a cause pointing to a
// cause). Links to defects outside the batch are checked by the database.
export function rootLinkProblem(defects: DefectInput[]) {
  const byId = new Map(defects.map((defect) => [defect.id, defect]))
  for (const defect of defects) {
    if (!defect.rootCauseId || defect.deleted) continue
    const cause = byId.get(defect.rootCauseId)
    if (cause?.rootCauseId) return `"${defect.title}" is linked to a cause that is itself linked to another cause.`
    if (cause?.deleted) return `"${defect.title}" is linked to a deleted cause.`
  }
  return null
}

export const AREA_KINDS = ['room', 'wet_area', 'roof_exterior', 'roof_space', 'subfloor', 'exterior', 'site', 'outbuilding'] as const
export const AREA_STATUSES = ['not_started', 'inspected', 'limited', 'not_accessible', 'not_applicable'] as const

// A missing limitation reason is not refused here: one unfinished area must
// never block the rest of the sync. The app asks for the reason, and the
// report shows "reason not recorded".
export const areaInput = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1).max(80),
  kind: z.enum(AREA_KINDS).default('room'),
  status: z.enum(AREA_STATUSES).default('not_started'),
  limitation: z.string().max(2000).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  sortOrder: z.number().int().min(0).max(SORT_ORDER_MAX).optional(),
  deleted: z.boolean().optional(),
  clientUpdatedAt: z.iso.datetime({ offset: true }),
})

export const areaBatch = z.object({ areas: z.array(areaInput).max(200) })

export const photoInput = z.object({
  id: z.uuid(),
  defectId: z.uuid().nullable().optional(),
  areaId: z.uuid().nullable().optional(),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']).default('image/jpeg'),
  sizeBytes: z.number().int().positive().max(PHOTO_MAX_BYTES),
  sha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
  widthPx: z.number().int().positive().max(20_000).nullable().optional(),
  heightPx: z.number().int().positive().max(20_000).nullable().optional(),
  caption: z.string().max(300).nullable().optional(),
  source: z.enum(['camera', 'gallery']).default('camera'),
  capturedAt: z.iso.datetime({ offset: true }),
  sortOrder: z.number().int().min(0).max(SORT_ORDER_MAX).optional(),
})

export function photoPath(jobId: string, photoId: string, contentType: string) {
  const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'
  return `${jobId}/${photoId}.${extension}`
}

export const assessmentInput = z.object({
  buildingCondition: z.enum(BUILDING_CONDITIONS).nullable().optional(),
  majorIncidence: z.enum(INCIDENCE).nullable().optional(),
  minorIncidence: z.enum(INCIDENCE).nullable().optional(),
  pestRisk: z.enum(PEST_RISK).nullable().optional(),
  pestIntervalMonths: z.number().int().min(1).max(24).nullable().optional(),
  furtherInspections: z.array(z.enum(FURTHER_INSPECTIONS)).max(20).default([]),
  weather: z.string().trim().max(200).nullable().optional(),
  occupancy: z.string().trim().max(200).nullable().optional(),
  summary: z.string().max(4000).nullable().optional(),
  clientUpdatedAt: z.iso.datetime({ offset: true }),
})
