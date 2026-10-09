import Script from 'next/script'

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
      <GoogleAnalytics />
    </>
  )
}

function VercelWebAnalytics() {
  return (
    <>
      <Script id="vercel-analytics-init" strategy="afterInteractive">
        {`window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };`}
      </Script>
      <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
    </>
  )
}

function GoogleAnalytics() {
  if (!/^G-[A-Z0-9]{4,20}$/.test(measurementId)) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
    </>
  )
}
