import Link from 'next/link'
import { CONTACT_PHONE, CONTACT_PHONE_HREF, INSPECTOR_REGISTRATION } from '@/lib/site'

// Calls to action for the existing-home landing pages that Google Ads sends
// visitors to (owner request 25 Oct 2026). Ad visitors on phones left within
// seconds without finding a way to get a price, and desktop visitors went
// looking for the credentials page, so the price link and the registration
// are now in the first screen, again mid-page, and in a bar fixed to the
// bottom of phone screens. No price is shown (owner decision, option A).

export const PRICE_HREF = '/quote?service=building-and-pest'

export function HeroPriceCta() {
  return (
    <div className="hero-price-cta">
      <div className="hero-price-actions">
        <Link className="button hero-price-button" href={PRICE_HREF}>
          Get your price online
        </Link>
        <span>Most homes are priced instantly.</span>
      </div>
      <Link className="hero-trust" href="/credentials">
        Registered Building Inspector · {INSPECTOR_REGISTRATION} · Insured · Photo-based report
      </Link>
    </div>
  )
}

export function InlinePriceCta() {
  return (
    <div className="inline-price-cta">
      <div>
        <strong>Know the price before you book</strong>
        <span>Send the property details online. Most homes are priced instantly.</span>
      </div>
      <Link className="button" href={PRICE_HREF}>
        Get your price online
      </Link>
    </div>
  )
}

// Phones only (hidden above 840px by CSS). The spacer keeps the footer from
// sitting under the bar.
export function MobilePriceBar() {
  return (
    <>
      <div className="mobile-price-spacer" aria-hidden="true" />
      <nav className="mobile-price-bar" aria-label="Get a price or call">
        <Link className="button" href={PRICE_HREF}>
          Get your price
        </Link>
        <a className="button button-secondary" href={CONTACT_PHONE_HREF} aria-label={`Call ${CONTACT_PHONE}`}>
          Call
        </a>
      </nav>
    </>
  )
}
