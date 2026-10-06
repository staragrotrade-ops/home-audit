import type { MetadataRoute } from 'next'
import { GUIDES } from '@/lib/guides'
import { SERVICE_AREAS } from '@/lib/service-areas'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/building-and-pest-inspections',
    '/pre-purchase-building-inspection',
    '/new-home-inspections',
    '/practical-completion-inspection',
    '/about',
    '/credentials',
    '/service-areas',
    '/guides',
    ...SERVICE_AREAS.map((area) => `/service-areas/${area.slug}`),
  ]

  const updatedEditorialRoutes = new Set([
    '',
    '/pre-purchase-building-inspection',
    '/guides',
  ])

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: new Date(
        updatedEditorialRoutes.has(route)
          ? '2026-10-04T11:00:00+11:00'
          : '2026-10-03T00:00:00+10:00',
      ),
      ...(route === ''
        ? { images: [`${SITE_URL}/home-audit-inspector-melbourne.webp`] }
        : {}),
    })),
    ...GUIDES.map((guide) => ({
      url: `${SITE_URL}${guide.path}`,
      lastModified: new Date(guide.dateModified),
    })),
  ]
}
