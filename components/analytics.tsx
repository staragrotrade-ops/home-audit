import Script from 'next/script'
import { GOOGLE_ADS_ID, isGoogleAdsId } from '@/lib/google-ads'

// Google Analytics 4 loads only when a measurement ID is configured. Set
// NEXT_PUBLIC_GA_MEASUREMENT_ID in the Production environment only, so preview
// and local traffic stay out of the reports.
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

// Vercel Web Analytics is enabled for the project in the Vercel dashboard. Its
// script is served from this origin, uses no cookies, and is only added to
// production builds so preview and local visits are not counted.
const isVercelProduction = process.env.VERCEL_ENV === 'production'

export function Analytics() {
  return (
    <>
      {isVercelProduction ? <VercelWebAnalytics /> : null}
      <GoogleTag />
    </>
  )
}

function VercelWebAnalytics() {
  return (
    <>
      <Script id="vercel-analytics-init" strategy="afterInteractive">
        {`window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
window.va('beforeSend', function (event) {
  // Order and booking links carry a private token: report them without it.
  return Object.assign({}, event, {
    url: event.url.replace(/\\/(order|booking)\\/[^/?#]+/, '/$1/[token]'),
  });
});`}
      </Script>
      <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
    </>
  )
}

// One Google tag (gtag.js) serves both Google Analytics 4 (when a measurement
// ID is configured) and the Google Ads account. Google Ads only loads on the
// production site, so preview and local quotes never count as conversions.
function GoogleTag() {
  const ga4 = /^G-[A-Z0-9]{4,20}$/.test(measurementId) ? measurementId : ''
  const ads = isVercelProduction && isGoogleAdsId(GOOGLE_ADS_ID) ? GOOGLE_ADS_ID : ''
  const ids = [ga4, ads].filter(Boolean)
  if (ids.length === 0) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ids[0]}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
// Private order and booking links and admin pages are never sent to Google.
if (!/^\\/(order|booking|admin)(\\/|$)/.test(location.pathname)) {
  gtag('js', new Date());
${ids.map((id) => `  gtag('config', '${id}');`).join('\n')}
}`}
      </Script>
    </>
  )
}
