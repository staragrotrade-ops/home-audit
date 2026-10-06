# SEO and Domain Strategy

## Canonical domain

`https://homeaudit.com.au` is the permanent brand and canonical domain.

The short exact-category domain is stronger operationally than a long,
location-heavy alternative because it is memorable, broad enough for both
existing-home and new-home inspections, and can support future services without
a rebrand. Location intent belongs in page titles, copy, structured data,
service-area pages and the Google Business Profile.

## Site roles

- Home Audit: long-term brand, SEO content and conversion platform.
- Owner Builder Inspection Melbourne: dedicated 137B education, eligibility,
  quote and booking destination; Home Audit links to it as a specialist service.
- NBI: legacy/bridge site for roughly two to three years. Existing ranked URLs
  should be inventoried before any redirects are introduced.

## Initial search architecture

- `/building-and-pest-inspections`
- `/pre-purchase-building-inspection`
- `/new-home-inspections`
- `/practical-completion-inspection`
- `/about`
- `/credentials`
- `/service-areas`
- `/service-areas/[suburb]` for 12 initial priority locations across the
  Mornington Peninsula / Frankston and Casey / Cardinia
- Future service pages for pre-purchase, pre-auction, timber pest, PCI and each
  genuine construction stage.
- Further location pages only where the service coverage and content are real;
  improve the initial cluster before expanding and avoid thin suburb-page
  duplication.

All indexable public pages use self-referencing canonicals. The transactional
quote route remains accessible but is `noindex` and is excluded from the
sitemap. The `www` hostname redirects permanently to the apex domain. Admin and
API routes are excluded from crawling, and Vercel preview hosts emit a noindex
response header.

## Migration rule

Do not redirect NBI or the 137B site wholesale. Create a URL-to-URL map using
Search Console, analytics, backlinks and current rankings. Redirect only where
the Home Audit destination is a genuine content replacement.
