import type { Metadata, Viewport } from 'next'
import { Analytics } from '@/components/analytics'
import { JsonLd } from '@/components/json-ld'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import {
  COMPANY_ACN,
  COMPANY_NAME,
  INSPECTOR_NAME,
  INSPECTOR_REGISTRATION,
  INSPECTOR_REGISTRATION_CLASS,
  SITE_NAME,
  SITE_URL,
} from '@/lib/site'
import './globals.css'

const defaultTitle = 'Home Audit | Building, Pest & New Home Inspections Melbourne'
const defaultDescription =
  'Independent building and pest inspections for existing homes, plus new home stage inspections across Melbourne and supported Victorian locations.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: defaultTitle,
    template: '%s | Home Audit',
  },
  description: defaultDescription,
  alternates: { canonical: '/' },
  applicationName: SITE_NAME,
  category: 'Building inspection',
  creator: SITE_NAME,
  publisher: COMPANY_NAME,
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: '/',
    siteName: SITE_NAME,
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: '/home-audit-inspector-melbourne.webp',
        width: 1500,
        height: 938,
        alt: 'Independent building inspector reviewing a Melbourne home',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
    images: ['/home-audit-inspector-melbourne.webp'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#294b4a',
}

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: ['homeaudit.com.au'],
      url: `${SITE_URL}/`,
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      legalName: COMPANY_NAME,
      identifier: `ACN ${COMPANY_ACN}`,
      url: `${SITE_URL}/`,
      areaServed: [
        { '@type': 'City', name: 'Melbourne' },
        { '@type': 'AdministrativeArea', name: 'Victoria' },
      ],
      knowsAbout: [
        'Building inspections',
        'Timber pest inspections',
        'Pre-purchase inspections',
        'New home stage inspections',
        'Practical completion inspections',
      ],
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/credentials#inspector`,
      name: INSPECTOR_NAME,
      jobTitle: INSPECTOR_REGISTRATION_CLASS,
      affiliation: { '@id': `${SITE_URL}/#organization` },
      hasCredential: {
        '@type': 'EducationalOccupationalCredential',
        name: INSPECTOR_REGISTRATION_CLASS,
        credentialCategory: 'Victorian building practitioner registration',
        identifier: INSPECTOR_REGISTRATION,
      },
      url: `${SITE_URL}/credentials`,
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <JsonLd data={structuredData} />
        <Analytics />
      </body>
    </html>
  )
}
