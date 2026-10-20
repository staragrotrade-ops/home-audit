// Server-only. Job floorplans: storing uploads and a best-effort fetch of the
// floorplan image from the customer's listing link.
//
// The listing fetch is deliberately modest: one page request, no retries, no
// headless browser, no attempt to get round bot protection. Large portals
// often refuse it; then the customer or admin uploads the plan instead.
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export const FLOORPLAN_BUCKET = 'job-floorplans'
export const FLOORPLAN_MAX_BYTES = 20 * 1024 * 1024
export const FLOORPLAN_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
export type FloorplanType = (typeof FLOORPLAN_TYPES)[number]
export type FloorplanSource = 'listing' | 'customer' | 'admin' | 'onsite'

const EXTENSION: Record<FloorplanType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

const PAGE_MAX_BYTES = 4 * 1024 * 1024
const FETCH_TIMEOUT_MS = 10_000
const USER_AGENT = 'HomeAuditBot/1.0 (+https://homeaudit.com.au; floorplan for a booked inspection)'

export function isFloorplanType(value: string): value is FloorplanType {
  return (FLOORPLAN_TYPES as readonly string[]).includes(value)
}

export function floorplanPath(jobId: string, source: FloorplanSource, type: FloorplanType) {
  return `${jobId}/${source}-${Date.now()}-${randomUUID()}.${EXTENSION[type]}`
}

// --- Finding floorplan images in a listing page (pure, tested) -------------

const IMAGE_URL = /https?:\\?\/\\?\/[^\s"'<>()]+?\.(?:jpe?g|png|webp)(?:\?[^\s"'<>()]*)?/gi
const FLOORPLAN_WORD = /floor[\s_-]?plan/i

function unescapeUrl(raw: string) {
  return raw.replace(/\\\//g, '/').replace(/&amp;/g, '&').replace(/\\u0026/gi, '&')
}

// Returns likely floorplan image URLs, best first: URLs that themselves say
// "floorplan", then images whose tag or JSON neighbourhood says "floorplan"
// (alt text, a "floorplans" array). Plain photos are never returned.
export function findFloorplanImageUrls(html: string, pageUrl: string): string[] {
  const strong: string[] = []
  const weak: string[] = []

  for (const match of html.matchAll(IMAGE_URL)) {
    const url = unescapeUrl(match[0])
    const start = match.index ?? 0
    if (FLOORPLAN_WORD.test(url)) {
      strong.push(url)
      continue
    }
    // Look a short way back for the attribute or JSON key that names it.
    const before = html.slice(Math.max(0, start - 160), start)
    const after = html.slice(start + match[0].length, start + match[0].length + 120)
    if (FLOORPLAN_WORD.test(before) || /^[^<>]{0,80}alt=["'][^"']*floor[\s_-]?plan/i.test(after)) {
      weak.push(url)
    }
  }

  // <img alt="Floor plan" src="/relative.jpg"> on agency sites.
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0]
    if (!FLOORPLAN_WORD.test(tag)) continue
    const src = tag.match(/\b(?:data-src|src)=["']([^"']+)["']/i)?.[1]
    if (!src || src.startsWith('data:')) continue
    try {
      weak.push(new URL(unescapeUrl(src), pageUrl).toString())
    } catch {
      // ignore malformed src
    }
  }

  const seen = new Set<string>()
  return [...strong, ...weak].filter((url) => {
    if (!/^https:\/\//i.test(url) || seen.has(url)) return false
    seen.add(url)
    return true
  }).slice(0, 4)
}

// --- Safe fetching ---------------------------------------------------------

function isPrivateAddress(address: string) {
  if (isIP(address) === 6) {
    const lower = address.toLowerCase()
    if (lower.startsWith('::ffff:')) return isPrivateAddress(lower.slice(7))
    return lower === '::1' || lower === '::' || /^(fc|fd|fe8|fe9|fea|feb)/.test(lower)
  }
  const [a, b] = address.split('.').map(Number)
  return (
    a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  )
}

// Only public https hosts by name; never an IP literal or an internal address.
export async function assertPublicHttpsUrl(raw: string) {
  const url = new URL(raw)
  if (url.protocol !== 'https:') throw new Error('Only https links are fetched.')
  if (url.username || url.password) throw new Error('Links with credentials are not fetched.')
  if (isIP(url.hostname.replace(/^\[|\]$/g, ''))) throw new Error('Links to an IP address are not fetched.')
  if (url.port && url.port !== '443') throw new Error('Links with a custom port are not fetched.')
  const addresses = await lookup(url.hostname, { all: true })
  if (!addresses.length || addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new Error('That host is not reachable from the website.')
  }
  return url
}

async function readCapped(response: Response, maxBytes: number) {
  const declared = Number(response.headers.get('content-length') || 0)
  if (declared > maxBytes) throw new Error('The file is too large.')
  const reader = response.body?.getReader()
  if (!reader) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new Error('The file is too large.')
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

async function safeGet(raw: string, accept: string, maxBytes: number) {
  let current = raw
  // Follow up to three redirects by hand so each hop is checked.
  for (let hop = 0; hop < 4; hop += 1) {
    const url = await assertPublicHttpsUrl(current)
    const response = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': USER_AGENT, Accept: accept, 'Accept-Language': 'en-AU,en;q=0.8' },
    })
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get('location')
      if (!next) throw new Error('Redirect without a destination.')
      current = new URL(next, url).toString()
      continue
    }
    return { response, body: response.ok ? await readCapped(response, maxBytes) : new Uint8Array(), url }
  }
  throw new Error('Too many redirects.')
}

export function sniffImageType(bytes: Uint8Array): FloorplanType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) return 'image/webp'
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf'
  return null
}

// Width and height from the image header, so the app can lay out pins before
// the image has downloaded. Null for PDF or an unreadable header.
export function imageSize(bytes: Uint8Array, type: FloorplanType): { width: number; height: number } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  try {
    if (type === 'image/png') return { width: view.getUint32(16), height: view.getUint32(20) }
    if (type === 'image/jpeg') {
      let offset = 2
      while (offset + 9 < bytes.length) {
        if (bytes[offset] !== 0xff) return null
        const marker = bytes[offset + 1]
        const length = view.getUint16(offset + 2)
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) }
        }
        offset += 2 + length
      }
    }
    if (type === 'image/webp') {
      const chunk = String.fromCharCode(...bytes.slice(12, 16))
      if (chunk === 'VP8X') {
        return {
          width: 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)),
          height: 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)),
        }
      }
      if (chunk === 'VP8 ') return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff }
      if (chunk === 'VP8L') {
        const bits = view.getUint32(21, true)
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
      }
    }
  } catch {
    return null
  }
  return null
}

// --- Storing ----------------------------------------------------------------

export async function storeFloorplan(
  supabase: SupabaseClient,
  input: {
    jobId: string
    bytes: Uint8Array
    source: FloorplanSource
    sourceUrl?: string | null
    levelLabel?: string
    staffId?: string | null
  },
) {
  const type = sniffImageType(input.bytes)
  if (!type) throw new Error('Upload a JPG, PNG, WebP or PDF floorplan.')
  if (input.bytes.byteLength > FLOORPLAN_MAX_BYTES) throw new Error('The floorplan must be under 20 MB.')

  const path = floorplanPath(input.jobId, input.source, type)
  const { error: uploadError } = await supabase.storage
    .from(FLOORPLAN_BUCKET)
    .upload(path, input.bytes, { contentType: type, upsert: false })
  if (uploadError) throw new Error('Unable to store the floorplan.')

  const { count } = await supabase
    .from('job_floorplans')
    .select('id', { count: 'exact', head: true })
    .eq('job_id', input.jobId)
    .eq('status', 'active')

  const size = imageSize(input.bytes, type)
  const { data, error } = await supabase
    .from('job_floorplans')
    .insert({
      job_id: input.jobId,
      level_label: (input.levelLabel || '').trim().slice(0, 60) || (count ? `Level ${count + 1}` : 'Ground floor'),
      sort_order: count || 0,
      storage_path: path,
      content_type: type,
      size_bytes: input.bytes.byteLength,
      width_px: size?.width ?? null,
      height_px: size?.height ?? null,
      source: input.source,
      source_url: input.sourceUrl || null,
      uploaded_by_staff_id: input.staffId || null,
    })
    .select('id,level_label,content_type,source')
    .single()
  if (error || !data) {
    await supabase.storage.from(FLOORPLAN_BUCKET).remove([path])
    throw new Error('Unable to record the floorplan.')
  }
  return data
}

// --- Listing fetch ------------------------------------------------------------

export type ListingFetchResult = { status: 'found' | 'not_found' | 'blocked' | 'failed'; note: string }

async function recordFetch(supabase: SupabaseClient, jobId: string, result: ListingFetchResult) {
  await supabase
    .from('jobs')
    .update({
      floorplan_fetch_status: result.status,
      floorplan_fetch_at: new Date().toISOString(),
      floorplan_fetch_note: result.note.slice(0, 300),
    })
    .eq('id', jobId)
  await supabase.from('audit_events').insert({
    job_id: jobId,
    event_type: 'floorplan_fetch',
    actor_type: 'system',
    event_data: result,
  })
  return result
}

// Tries once to copy the floorplan from the listing. Never throws: the outcome
// is recorded on the job so admin can see why and upload by hand.
export async function fetchListingFloorplan(supabase: SupabaseClient, jobId: string): Promise<ListingFetchResult> {
  const { data: job } = await supabase
    .from('jobs')
    .select('id,listing_url,service_family')
    .eq('id', jobId)
    .maybeSingle()
  if (!job?.listing_url) return recordFetch(supabase, jobId, { status: 'not_found', note: 'No listing link on this job.' })

  const { count } = await supabase
    .from('job_floorplans')
    .select('id', { count: 'exact', head: true })
    .eq('job_id', jobId)
    .eq('status', 'active')
  if (count) return { status: 'found', note: 'A floorplan is already on file.' }

  try {
    const page = await safeGet(job.listing_url, 'text/html,application/xhtml+xml', PAGE_MAX_BYTES)
    if ([401, 403, 429].includes(page.response.status)) {
      return recordFetch(supabase, jobId, {
        status: 'blocked',
        note: `The listing site refused the request (${page.response.status}). Ask the customer to upload the floorplan.`,
      })
    }
    if (!page.response.ok) {
      return recordFetch(supabase, jobId, { status: 'failed', note: `Listing page returned ${page.response.status}.` })
    }

    const html = new TextDecoder().decode(page.body)
    const candidates = findFloorplanImageUrls(html, page.url.toString())
    if (!candidates.length) {
      return recordFetch(supabase, jobId, { status: 'not_found', note: 'No floorplan image found on the listing page.' })
    }

    for (const candidate of candidates) {
      try {
        const image = await safeGet(candidate, 'image/*', FLOORPLAN_MAX_BYTES)
        if (!image.response.ok || !sniffImageType(image.body)) continue
        await storeFloorplan(supabase, { jobId, bytes: image.body, source: 'listing', sourceUrl: candidate })
        return recordFetch(supabase, jobId, { status: 'found', note: 'Floorplan copied from the listing.' })
      } catch {
        // try the next candidate
      }
    }
    return recordFetch(supabase, jobId, { status: 'failed', note: 'Floorplan images on the listing could not be downloaded.' })
  } catch (error) {
    return recordFetch(supabase, jobId, {
      status: 'failed',
      note: error instanceof Error ? error.message : 'The listing could not be read.',
    })
  }
}

export async function signedFloorplanUrl(supabase: SupabaseClient, path: string, seconds = 3600) {
  const { data } = await supabase.storage.from(FLOORPLAN_BUCKET).createSignedUrl(path, seconds)
  return data?.signedUrl || null
}
