import type { Metadata } from 'next'
import { PartnerRegistrationForm } from '@/components/partner-registration-form'
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/lib/site'

export const metadata: Metadata = {
  title: { absolute: 'Referral partners | Home Audit' },
  description: 'Register as a Home Audit referral partner.',
  robots: { index: false, follow: false, noarchive: true },
  alternates: { canonical: '/partners/register' },
}

// Reached from a small link in the footer. Not in the sitemap or the menu.
export default function PartnerRegisterPage() {
  return (
    <main id="main-content" className="quote-page">
      <div className="container order-page">
        <p className="eyebrow">Referral partners</p>
        <h1>Register as a referral partner</h1>
        <p>
          If you refer buyers or homeowners to us from time to time (as a conveyancer, solicitor,
          buyer&apos;s agent, mortgage broker, real estate agent or past customer), register once. You
          get your own link, so we know which bookings came from you.
        </p>
        <p className="order-hint">
          We check each registration before it is approved. Any referral arrangement is agreed with you
          directly, and buyers see who referred them.
        </p>
        <section className="quote-panel">
          <PartnerRegistrationForm turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''} />
        </section>
        <p>
          Questions? Call <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a> or email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </main>
  )
}
