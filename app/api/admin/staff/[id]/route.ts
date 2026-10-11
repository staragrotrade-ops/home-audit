import { z } from 'zod'
import { adminError, adminJson, requireAdmin, temporaryPassword } from '@/lib/admin-api'
import { readJsonBody } from '@/lib/request-guard'

export const runtime = 'nodejs'

const schema = z
  .object({
    active: z.boolean().optional(),
    resetPassword: z.literal(true).optional(),
  })
  .strict()

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    const input = schema.parse(await readJsonBody(request, 2_000))

    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id,auth_user_id')
      .eq('id', id)
      .maybeSingle()
    if (staffError || !staff) throw new Error('Inspector not found.')

    if (input.active !== undefined) {
      const { error } = await supabase.from('staff').update({ active: input.active }).eq('id', id)
      if (error) throw new Error(error.message)
    }

    if (input.resetPassword) {
      const password = temporaryPassword()
      const { error } = await supabase.auth.admin.updateUserById(staff.auth_user_id, { password })
      if (error) throw new Error(error.message)
      return adminJson({ ok: true, temporaryPassword: password })
    }

    return adminJson({ ok: true })
  } catch (error) {
    return adminError(error, 'Unable to update the inspector.')
  }
}
