// Links copied from Google results, Google AI or social apps are often
// redirect links (google.com/goto, google.com/url, ...) instead of the listing
// page itself.
const REDIRECT_PATTERNS = [
  /^https?:\/\/(www\.)?google\.[a-z.]+\/(goto|url|aclk)\b/i,
  /^https?:\/\/[a-z0-9.-]*vertexaisearch\.cloud\.google\.com\//i,
  /^https?:\/\/(l|lm)\.facebook\.com\//i,
  /^https?:\/\/(www\.)?bing\.com\/ck\//i,
]

export function isRedirectLink(url: string) {
  return REDIRECT_PATTERNS.some((pattern) => pattern.test(url.trim()))
}
