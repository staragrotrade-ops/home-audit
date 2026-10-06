import Script from 'next/script'

// Google Analytics 4 loads only when a measurement ID is configured. Set
// NEXT_PUBLIC_GA_MEASUREMENT_ID in the Production environment only, so preview
// and local traffic stay out of the reports.
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

export function Analytics() {
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
