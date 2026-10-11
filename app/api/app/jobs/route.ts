import { z } from 'zod'
import { appError, authenticateInspector } from '@/lib/supabase-user'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FEED_LIMIT = 400
const isoDate = z.iso.datetime({ offset: true })

// The jobs this inspector can see (assigned jobs; every job for an admin),
// most recently changed first. Optional ?updatedSince= for incremental sync.
export async function GET(request: Request) {
  try {
    const { supabase } = await authenticateInspector(request)
    const updatedSince = new URL(request.url).searchParams.get('updatedSince')
    if (updatedSince) isoDate.parse(updatedSince)

    let query = supabase
      .from('inspector_job_feed')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(FEED_LIMIT)
    if (updatedSince) query = query.gt('updated_at', updatedSince)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return Response.json(
      { ok: true, serverTime: new Date().toISOString(), jobs: data || [] },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return appError(error, 'Unable to load jobs.')
  }
}
