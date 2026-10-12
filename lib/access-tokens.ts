// Server-only. Random links that let a customer open their own order page.
import { createHash, randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SITE_URL } from '@/lib/site'

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function isTokenShape(token: string) {
  return /^[A-Za-z0-9_-]{43}$/.test(token)
}

export async function issueOrderToken(supabase: SupabaseClient, jobId: string) {
  const token = randomBytes(32).toString('base64url')
  const { error } = await supabase
    .from('job_access_tokens')
    .insert({ token_hash: hashToken(token), job_id: jobId })
  if (error) throw new Error(error.message)
  return token
}

export function orderUrl(token: string) {
  return `${SITE_URL}/order/${token}`
}

export async function jobIdForToken(supabase: SupabaseClient, token: string) {
  if (!isTokenShape(token)) return null
  const { data } = await supabase
    .from('job_access_tokens')
    .select('job_id,expires_at')
    .eq('token_hash', hashToken(token))
    .maybeSingle()
  if (!data || new Date(data.expires_at) < new Date()) return null
  return data.job_id as string
}
