import { z } from 'zod'

const optionalEmail = z.union([z.literal(''), z.email()]).optional()
const optionalDate = z.union([z.literal(''), z.iso.date()])
const optionalSmallCount = z.union([
  z.literal(''),
  z
    .string()
    .regex(/^\d{1,2}$/)
    .refine((value) => Number(value) <= 30, 'Enter a value from 0 to 30.'),
])

export const quoteRequestSchema = z
  .object({
    service_family: z.enum(['existing_home', 'new_home']),
    inspection_type: z
      .enum(['', 'building_and_pest', 'building_only', 'pre_auction'])
      .default(''),
    new_home_stages: z
      .array(z.enum(['slab', 'frame', 'pre_plaster', 'fixing', 'pci']))
      .max(5)
      .default([]),
    property_address: z.string().trim().min(5).max(240),
    suburb: z.string().trim().max(100).default(''),
    postcode: z.string().trim().regex(/^\d{4}$/).or(z.literal('')),
    property_type: z.enum(['', 'house', 'townhouse', 'unit_apartment', 'other']).default(''),
    storeys: z.enum(['', '1', '2', '3_plus']).default(''),
    bedrooms: optionalSmallCount.default(''),
    bathrooms: optionalSmallCount.default(''),
    builder_name: z.string().trim().max(160).default(''),
    expected_ready_date: optionalDate.default(''),
    first_name: z.string().trim().min(1).max(80),
    last_name: z.string().trim().min(1).max(80),
    email: z.email().max(180),
    mobile: z
      .string()
      .trim()
      .min(8)
      .max(40)
      .regex(/^[0-9+() -]+$/),
    conveyancer_email: optionalEmail,
    agent_email: optionalEmail,
    preferred_date_1: optionalDate.default(''),
    preferred_date_2: optionalDate.default(''),
    deadline: optionalDate.default(''),
    flexible_booking: z.boolean().default(false),
    access_contact: z.string().trim().max(180).default(''),
    access_notes: z.string().trim().max(1500).default(''),
    source_self_reported: z.string().trim().max(100).default(''),
    attribution: z
      .object({
        first_landing_url: z.string().max(1000).default(''),
        first_referrer: z.string().max(1000).default(''),
        utm_source: z.string().max(180).default(''),
        utm_medium: z.string().max(180).default(''),
        utm_campaign: z.string().max(180).default(''),
        utm_term: z.string().max(180).default(''),
        utm_content: z.string().max(180).default(''),
        google_click_id: z.string().max(300).default(''),
      })
      .default({
        first_landing_url: '',
        first_referrer: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_term: '',
        utm_content: '',
        google_click_id: '',
      }),
    privacy_consent: z.literal(true, {
      error: 'Please confirm you have read the privacy notice.',
    }),
    website: z.string().max(200).default(''),
  })
  .superRefine((value, context) => {
    if (value.service_family === 'existing_home' && !value.inspection_type) {
      context.addIssue({
        code: 'custom',
        path: ['inspection_type'],
        message: 'Choose an inspection type.',
      })
    }

    if (value.service_family === 'new_home' && value.new_home_stages.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['new_home_stages'],
        message: 'Choose at least one construction stage.',
      })
    }
  })

export type QuoteRequest = z.infer<typeof quoteRequestSchema>
