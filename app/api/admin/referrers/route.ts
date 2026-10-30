import { z } from 'zod'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'
import { createUniqueReferrerCode } from '@/lib/referral-store'
import { commissionColumns, REFERRER_TYPES } from '@/lib/referrals'
import { emailReferrerLink } from '@/lib/referrer-emails'
import { readJsonBody } from '@/lib/request-guard'

export const runtime = 'nodejs'

const types = REFERRER_TYPES.map(([value]) => value) as [string, ...string[]]
const optional = (max: number) => z.string().trim().max(max).default('')

const commission = {
  commissionType: z.enum(['', 'fixed', 'percent']).default(''),
  commissionValue: z.union([z.string().max(20), z.number()]).default(''),
}

const createSchema = z
  .object({
    referrerType: z.enum(types),
    name: z.string().trim().min(2).max(120),
    agency: optional(160),
    branch: optional(160),
    mobile: z.string().trim().max(30).regex(/^[0-9+() -]*$/, 'Use digits, spaces and + in the mobile number.').default(''),
    email: z.union([z.literal(''), z.email('Check the email address.').max(180)]).default(''),
    notes: optional(1000),
    language: z.enum(['en', 'zh']).default('en'),
    ...commission,
  })
  .strict()

const updateSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('status'), id: z.uuid(), status: z.enum(['pending', 'active', 'disabled']) }).strict(),
  z.object({ action: z.literal('commission'), id: z.uuid(), ...commission }).strict(),
  z.object({ action: z.literal('email'), id: z.uuid() }).strict(),
  z.object({ action: z.literal('language'), id: z.uuid(), language: z.enum(['en', 'zh']) }).strict(),
])

// Adds a referrer straight away as active (the owner is adding them).
export async function POST(request: Request) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase
  try {
    const parsed = createSchema.safeParse(await readJsonBody(request, 5_000))
    if (!parsed.success) {
      return adminJson({ ok: false, error: parsed.error.issues[0]?.message || 'Check the details.' }, 400)
    }
    const input = parsed.data
    const columns = commissionColumns(input.commissionType, input.commissionValue)
    const refCode = await createUniqueReferrerCode(supabase, input.name)
    const { data, error } = await supabase
      .from('referrers')
      .insert({
        referrer_type: input.referrerType,
        name: input.name,
        agency: input.agency || null,
        branch: input.branch || null,
        mobile: input.mobile || null,
        email: input.email.toLowerCase() || null,
        notes: input.notes || null,
        ...(input.language === 'zh' ? { language: 'zh' } : {}),
        ref_code: refCode,
        status: 'active',
        source: 'admin',
        approved_at: new Date().toISOString(),
        ...columns,
      })
      .select('id,ref_code')
      .single()
    if (error) throw new Error(error.message)
    return adminJson({ ok: true, referrer: data })
  } catch (error) {
    return adminError(error, 'Unable to add the referrer.')
  }
}

// Approve, disable or reactivate; change the commission; or email the link.
// Approving someone who registered online emails them their link
// (the registration page tells them it will).
export async function PATCH(request: Request) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase
  try {
    const input = updateSchema.parse(await readJsonBody(request, 2_000))

    if (input.action === 'email') {
      await emailReferrerLink(supabase, input.id, false)
      return adminJson({ ok: true })
    }
    if (input.action === 'language') {
      const { error } = await supabase
        .from('referrers')
        .update({ language: input.language, updated_at: new Date().toISOString() })
        .eq('id', input.id)
      if (error) throw new Error(error.message)
      return adminJson({ ok: true })
    }

    const { data: before } = await supabase
      .from('referrers')
      .select('status,source,email')
      .eq('id', input.id)
      .maybeSingle()

    const update =
      input.action === 'status'
        ? {
            status: input.status,
            approved_at: input.status === 'active' ? new Date().toISOString() : null,
          }
        : commissionColumns(input.commissionType, input.commissionValue)
    const { error } = await supabase
      .from('referrers')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('id', input.id)
    if (error) throw new Error(error.message)

    let emailed = false
    let emailError = ''
    const approvingRegistration =
      input.action === 'status' &&
      input.status === 'active' &&
      before?.status === 'pending' &&
      before?.source === 'self' &&
      Boolean(before?.email)
    if (approvingRegistration) {
      try {
        await emailReferrerLink(supabase, input.id, true)
        emailed = true
      } catch (sendError) {
        emailError = sendError instanceof Error ? sendError.message : 'Email failed.'
      }
    }
    return adminJson({ ok: true, emailed, emailError })
  } catch (error) {
    return adminError(error, 'Unable to update the referrer.')
  }
}
