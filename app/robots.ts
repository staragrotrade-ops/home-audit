import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  const protectedPaths = ['/admin', '/api/']

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: protectedPaths,
      },
      {
        userAgent: [
          'OAI-SearchBot',
          'ChatGPT-User',
          'GPTBot',
          'Claude-SearchBot',
          'Claude-User',
          'PerplexityBot',
          'Perplexity-User',
        ],
        allow: '/',
        disallow: protectedPaths,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
