import { z } from 'zod'
import { issueOrderToken, orderUrl } from '@/lib/access-tokens'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { readJsonBody } from '@/lib/request-guard'
import { TRANSLATION_FEE_CENTS } from '@/lib/translation'

export const runtime = 'nodejs'

const schema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().max(60).default(''),
  email: z.email().max(160),
  mobile: z.string().trim().max(20).regex(/^[0-9 +()-]*$/).default(''),
  address: z.string().trim().min(3).max(200),
  suburb: z.string().trim().max(80).default(''),
  postcode: z.union([z.literal(''), z.string().regex(/^\d{4}$/)]).default(''),
  inspectionType: z.enum(['building_and_pest', 'building_only', 'pre_auction']),
  price: z.number().positive().max(20000),
  preferredDate: z.union([z.literal(''), z.iso.date()]).default(''),
  notes: z.string().max(2000).default(''),
  translationZh: z.boolean().default(false),
})

// A job taken by phone or in person. Invoiced and paid outside the website;
// mark the payment on the job when it arrives.
export async function POST(request: Request) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase
  try {
    const input = schema.parse(await readJsonBody(request, 8_000))
    const { data, error } = await supabase.rpc('create_manual_job', {
      p: {
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        mobile: input.mobile,
        address: input.address,
        suburb: input.suburb,
        postcode: input.postcode,
        service_family: 'existing_home',
        inspection_type: input.inspectionType,
        price: input.price,
        preferred_date: input.preferredDate,
        notes: input.notes,
        translation_zh: input.translationZh,
        translation_fee: TRANSLATION_FEE_CENTS / 100,
      },
    })
    if (error) throw new Error(error.message)
    const row = (Array.isArray(data) ? data[0] : data) as { job_id: string; public_reference: string }
    const url = orderUrl(await issueOrderToken(supabase, row.job_id))
    return adminJson({ ok: true, id: row.job_id, reference: row.public_reference, url })
  } catch (error) {
    return adminError(error, 'Unable to create the job.')
  }
}
