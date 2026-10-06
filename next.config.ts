import type { NextConfig } from 'next'

const isDevelopment = process.env.NODE_ENV !== 'production'
const isVercelPreview = process.env.VERCEL_ENV === 'preview'

// Static pages cannot carry per-request nonces, so inline scripts and styles
// emitted by Next.js are allowed. Everything else is limited to this origin
// plus Google Analytics, which only loads when a measurement ID is configured.
const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  'https://www.googletagmanager.com',
  ...(isDevelopment ? ["'unsafe-eval'"] : []),
  ...(isVercelPreview ? ['https://vercel.live'] : []),
]

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSources.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https:${isDevelopment ? ' ws:' : ''}`,
  `frame-src 'self'${isVercelPreview ? ' https://vercel.live' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.homeaudit.com.au' }],
        destination: 'https://homeaudit.com.au/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
