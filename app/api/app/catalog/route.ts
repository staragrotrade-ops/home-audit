import { z } from 'zod'
import { catalogPayload } from '@/lib/inspection-catalog'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Trades, elements, severities and the description templates, most used
// first. ?templatesSinceRev= returns only templates changed since then.
export async function GET(request: Request) {
  try {
    const { supabase } = await authenticateInspector(request)
    const since = new URL(request.url).searchParams.get('templatesSinceRev')
    const sinceRev = since ? z.coerce.number().int().min(0).parse(since) : 0

    const { data, error } = await supabase
      .from('defect_templates')
      .select('id,element_key,severity,title,observation,recommendation,use_count,last_used_at,active,sync_rev')
      .gt('sync_rev', sinceRev)
      .order('use_count', { ascending: false })
      .limit(2000)
    if (error) throw new Error(error.message)

    return Response.json(
      { ok: true, catalog: catalogPayload(), templates: data || [] },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return appError(error, 'Unable to load the catalog.')
  }
}
