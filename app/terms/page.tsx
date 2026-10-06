import type { Metadata } from 'next'
import Link from 'next/link'
import { COMPANY_ACN, COMPANY_NAME, CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Terms',
  alternates: { canonical: '/terms' },
  robots: { index: false, follow: true },
}

export default function TermsPage() {
  return (
    <main id="main-content" className="section legal-page">
      <div className="container prose">
        <p className="eyebrow">Terms</p>
        <h1>Website and enquiry terms</h1>
        <p>
          This website is operated by {COMPANY_NAME} (ACN {COMPANY_ACN}),
          trading as Home Audit. These terms cover use of the website and
          quote requests. They are not the inspection agreement.
        </p>

        <h2>Quote requests are not bookings</h2>
        <p>
          Sending a quote request or an email does not create an inspection
          booking. An inspection is confirmed only after we have agreed the
          scope, price, date and access with you in writing. Dates entered in
          the form are preferences until confirmed.
        </p>

        <h2>The inspection agreement</h2>
        <p>
          Every inspection is carried out under a written, service-specific
          agreement provided before the inspection. That agreement sets out
          the scope, the visual and non-invasive limitations, access
          requirements, payment, rescheduling and cancellation terms. Where
          that agreement differs from this page, the agreement applies.
        </p>

        <h2>Information on this website</h2>
        <p>
          The pages on this website give general information about inspection
          services and local housing. They are not advice about a particular
          property and do not replace an inspection, or legal, engineering or
          other specialist advice. Service availability depends on the exact
          address, safe access and scheduling.
        </p>

        <h2>Other websites</h2>
        <p>
          This website links to other websites, including our separate owner
          builder inspection service and government registers. Those websites
          have their own terms and privacy notices.
        </p>

        <h2>Website content</h2>
        <p>
          The text, images and design of this website belong to{' '}
          {COMPANY_NAME} or are used with permission. You may view and print
          pages for your own use. Please ask before reproducing them
          elsewhere.
        </p>

        <h2>Consumer rights and liability</h2>
        <p>
          Nothing in these terms excludes or limits rights you have under the
          Australian Consumer Law that cannot lawfully be excluded. Subject to
          those rights, we are not liable for loss arising from reliance on
          the general information on this website rather than on an inspection
          report or professional advice about the specific property.
        </p>

        <h2>Governing law and changes</h2>
        <p>
          These terms are governed by the laws of Victoria, Australia. We may
          update them from time to time; the current version is always
          published on this page.
        </p>

        <h2>Privacy and contact</h2>
        <p>
          Our handling of personal information is described in the{' '}
          <Link href="/privacy">privacy notice</Link>. Questions about these
          terms can be sent to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <p className="credential-note">Last updated: 6 October 2026.</p>
      </div>
    </main>
  )
}
