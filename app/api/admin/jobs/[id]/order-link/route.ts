import { z } from 'zod'
import { issueOrderToken, orderUrl } from '@/lib/access-tokens'
import { adminError, adminJson, requireAdmin } from '@/lib/admin-api'

export const runtime = 'nodejs'

// A fresh link to the customer's order page, to send by text or email.
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = requireAdmin(request)
  if (supabase instanceof Response) return supabase

  try {
    const { id } = await context.params
    z.uuid().parse(id)
    return adminJson({ ok: true, url: orderUrl(await issueOrderToken(supabase, id)) })
  } catch (error) {
    return adminError(error, 'Unable to create the link.')
  }
}
