export const SITE_NAME = 'Home Audit'
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://homeaudit.com.au'
).replace(/\/$/, '')

export const CONTACT_EMAIL = 'info@homeaudit.com.au'

export const COMPANY_NAME = 'GXH Consultancy Pty Ltd'
export const COMPANY_ACN = '649 792 094'
export const INSPECTOR_NAME = 'Xiaoqiong Yang'
export const INSPECTOR_REGISTRATION = 'IN-L 100094'
export const INSPECTOR_REGISTRATION_CLASS = 'Building Inspector (Limited)'
export const PRACTITIONER_SEARCH_URL =
  'https://www.bpc.vic.gov.au/find-and-check-a-practitioner'

export const PRIMARY_NAV = [
  { href: '/building-and-pest-inspections', label: 'Existing homes' },
  { href: '/new-home-inspections', label: 'New homes' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/service-areas', label: 'Service areas' },
  { href: '/guides', label: 'Guides' },
] as const
