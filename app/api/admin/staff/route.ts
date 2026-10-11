import { z } from 'zod'
import { adminError, adminJson, requireAdmin, temporaryPassword } from '@/lib/admin-api'
import { readJsonBody } from '@/lib/request-guard'

export const runtime = 'nodejs'

const schema = z.object({
  email: z.email().max(180),
  displayName: z.string().trim().min(2).max(80),
  role: z.enum(['inspector', 'admin']).default('inspector'),
  registrationNumber: z.string().trim().max(40).default(''),
})

// Creates an inspector login for the app. A temporary password is returned
// once, to be passed on to the inspector.
export async function POST(request: Request) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const input = schema.parse(await readJsonBody(request, 5_000))
    const password = temporaryPassword()
    const email = input.email.trim().toLowerCase()

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: input.displayName },
    })
    if (createError || !created.user) throw new Error(createError?.message || 'Unable to create the login.')

    const { error } = await supabase.from('staff').insert({
      auth_user_id: created.user.id,
      email,
      display_name: input.displayName,
      role: input.role,
      registration_number: input.registrationNumber || null,
    })
    if (error) {
      await supabase.auth.admin.deleteUser(created.user.id)
      throw new Error(error.message)
    }

    return adminJson({ ok: true, email, temporaryPassword: password }, 201)
  } catch (error) {
    return adminError(error, 'Unable to create the inspector.')
  }
}
