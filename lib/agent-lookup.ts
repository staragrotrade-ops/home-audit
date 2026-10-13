import { isRedirectLink } from './listing-url.ts'

// Server-only. Asks Gemini, with Google Search grounding, who the selling
// agent is for an address. The owner checks the answer before saving it.
const API = 'https://generativelanguage.googleapis.com/v1beta/models'

export type AgentLookup = {
  agentName: string
  agency: string
  mobile: string
  email: string
  priceGuide: string
  listingUrl: string
  confidence: 'high' | 'medium' | 'low'
  notes: string
  sources: { title: string; url: string }[]
}

export function agentLookupConfigured() {
  return Boolean(process.env.GEMINI_API_KEY)
}

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

// The model answers in text (JSON mode cannot be combined with search), so
// take the first {...} block and keep only the expected fields.
export function parseAgentAnswer(answer: string): Omit<AgentLookup, 'sources'> {
  const match = answer.match(/\{[\s\S]*\}/)
  let data: Record<string, unknown> = {}
  if (match) {
    try {
      data = JSON.parse(match[0]) as Record<string, unknown>
    } catch {
      data = {}
    }
  }
  const confidence = text(data.confidence, 10).toLowerCase()
  const listingUrl = text(data.listingUrl, 500)
  return {
    agentName: text(data.agentName, 120),
    agency: text(data.agency, 160),
    mobile: text(data.mobile, 40).replace(/[^0-9+() -]/g, ''),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(data.email, 180)) ? text(data.email, 180) : '',
    priceGuide: text(data.priceGuide, 160),
    listingUrl: /^https?:\/\/\S+$/.test(listingUrl) && !isRedirectLink(listingUrl) ? listingUrl : '',
    confidence: confidence === 'high' || confidence === 'medium' ? confidence : 'low',
    notes: text(data.notes, 400),
  }
}

export async function lookUpSellingAgent(address: string): Promise<AgentLookup> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Automatic agent lookup is not set up (GEMINI_API_KEY).')
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash'

  const prompt = [
    `Find the current sale listing for this property in Victoria, Australia: ${address}.`,
    'Search realestate.com.au, domain.com.au and the selling agency website.',
    'Reply with ONLY a JSON object with these keys:',
    'agentName, agency, mobile, email, priceGuide, listingUrl, confidence ("high", "medium" or "low"), notes.',
    'priceGuide is the advertised price or indicative selling price (Statement of Information), as written.',
    'Use an empty string for anything you cannot find. Do not guess phone numbers or emails.',
    'If several agents are listed, give the first one and mention the others in notes.',
    'If you are not sure the listing is for this exact address, set confidence to "low" and say why in notes.',
  ].join(' ')

  const response = await fetch(`${API}/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
    }),
    signal: AbortSignal.timeout(45_000),
  })
  const result = (await response.json().catch(() => ({}))) as {
    error?: { message?: string }
    candidates?: {
      content?: { parts?: { text?: string }[] }
      groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] }
    }[]
  }
  if (!response.ok) {
    throw new Error(`Google AI lookup failed: ${result.error?.message || response.status}`)
  }

  const candidate = result.candidates?.[0]
  const answer = (candidate?.content?.parts || []).map((part) => part.text || '').join('\n')
  const sources = (candidate?.groundingMetadata?.groundingChunks || [])
    .map((chunk) => ({ title: text(chunk.web?.title, 160), url: text(chunk.web?.uri, 1000) }))
    .filter((source) => source.url.startsWith('https://'))
    .slice(0, 6)

  return { ...parseAgentAnswer(answer), sources }
}
