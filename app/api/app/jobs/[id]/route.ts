import { z } from 'zod'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { supabase } = await authenticateInspector(request)
    const { id } = await context.params
    z.uuid().parse(id)
    const { data, error } = await supabase.from('inspector_job_feed').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) {
      return Response.json({ ok: false, error: 'Job not found.' }, { status: 404 })
    }
    return Response.json({ ok: true, job: data }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return appError(error, 'Unable to load the job.')
  }
}
