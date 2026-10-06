import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/site'

const socialImage = {
  url: '/home-audit-inspector-melbourne.webp',
  width: 1500,
  height: 938,
  alt: 'Independent building inspector reviewing a Melbourne home',
}

export function pageMetadata({
  title,
  description,
  path,
  index = true,
  appendSiteName = true,
  openGraphType = 'website',
  publishedTime,
  modifiedTime,
}: {
  title: string
  description: string
  path: string
  index?: boolean
  /** Set false when the title already contains the brand name. */
  appendSiteName?: boolean
  openGraphType?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
}): Metadata {
  const fullTitle = appendSiteName ? `${title} | ${SITE_NAME}` : title

  return {
    title: appendSiteName ? title : { absolute: title },
    description,
    alternates: { canonical: path },
    // A child segment replaces the whole `robots` object from the root layout,
    // so the Googlebot preview directives must be repeated here.
    robots: {
      index,
      follow: true,
      googleBot: index
        ? {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          }
        : { index: false, follow: true },
    },
    openGraph:
      openGraphType === 'article'
        ? {
            title: fullTitle,
            description,
            url: path,
            siteName: SITE_NAME,
            locale: 'en_AU',
            type: 'article' as const,
            publishedTime,
            modifiedTime,
            images: [socialImage],
          }
        : {
            title: fullTitle,
            description,
            url: path,
            siteName: SITE_NAME,
            locale: 'en_AU',
            type: 'website' as const,
            images: [socialImage],
          },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [socialImage.url],
    },
  }
}
