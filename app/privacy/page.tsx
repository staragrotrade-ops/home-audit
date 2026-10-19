import type { Metadata } from 'next'
import { COMPANY_ACN, COMPANY_NAME, CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy',
  alternates: { canonical: '/privacy' },
  robots: { index: false, follow: true },
}

export default function PrivacyPage() {
  return (
    <main id="main-content" className="section legal-page">
      <div className="container prose">
        <p className="eyebrow">Privacy</p>
        <h1>Privacy notice</h1>
        <p>
          Home Audit is operated by {COMPANY_NAME} (ACN {COMPANY_ACN}). This
          notice explains what personal information we handle when you use
          this website or ask us about an inspection.
        </p>

        <h2>What we collect</h2>
        <p>
          When you request a quote or email us, we collect the details you
          choose to provide: your name, email address, phone number, the
          property address and description, preferred dates, access
          arrangements and, where you supply them, contact details for your
          conveyancer, agent or builder. We also record how you found the
          website, such as the referring site or campaign link.
        </p>
        <p>
          If the quote form opens your email app instead of sending the request
          directly, we also keep a copy of the details you entered in the form,
          so we can follow up even if the email is not sent.
        </p>
        <p>
          When you accept the Inspection Agreement on your order page, we
          record which version you accepted and when.
        </p>
        <p>
          You can browse this website without giving us any personal
          information. If you choose not to provide the details we ask for, we
          may not be able to prepare a quote or carry out an inspection. If you
          give us contact details for another person, please make sure they
          are happy for us to contact them about the property.
        </p>

        <h2>How we use it</h2>
        <p>
          We use this information to respond to your enquiry, assess the
          inspection scope, prepare a quote, arrange access and appointments,
          deliver the report, take payment and keep the business records we
          are required to keep. We do not sell personal information or use it
          for unrelated marketing.
        </p>

        <h2>Details saved on your device</h2>
        <p>
          The quote form saves your unfinished answers in your own browser so
          you do not lose them between steps. That draft stays on your device,
          is removed automatically after seven days or once the request is
          submitted, and can be deleted at any time with the “Clear saved
          details” button on the quote form.
        </p>

        <h2>Who we share it with</h2>
        <p>
          Information is shared only where needed to provide the service: with
          the people you nominate for access to the property, and with service
          providers that host this website and store or deliver our business
          records, email, payments and accounts. Some of these providers
          store or process data outside Australia, including in the United
          States. We may also disclose information where the law requires it.
        </p>

        <h2>Website statistics</h2>
        <p>
          We measure how the website is used: which pages are viewed, for how
          long, which site or link a visit came from, the type of device and
          the country. A visit is counted with a random number kept in your
          browser for that visit only. We do not store your IP address. To
          stop misuse of the quote form we
          keep a scrambled code made from it, which cannot be turned back into
          the address, for up to two hours.
        </p>
        <p>
          If you send a quote request, we link it to the pages viewed during
          that visit. This helps us see which information was useful and
          where our enquiries come from. We do not use it for anything else.
        </p>

        <h2>Google Ads</h2>
        <p>
          We advertise on Google Search. This website uses the Google tag, which
          sets Google advertising cookies in your browser, so Google can tell us
          when someone who clicked one of our ads goes on to request a quote.
          Google receives the quote reference number, not your name, contact
          details or property address. If you arrive from an ad, the click
          code and campaign details in the link are saved in your browser for
          up to 90 days and are kept with your quote request. You can manage
          Google advertising settings at adssettings.google.com or block
          cookies in your browser.
        </p>

        <h2>Referral partners</h2>
        <p>
          Some visitors reach us through a link from a referral partner, such
          as a conveyancer, buyer&apos;s agent, mortgage broker or real estate
          agent. That link saves the partner&apos;s short code in a cookie in
          your browser for 90 days, so we know who referred you. We may pay
          that partner a referral fee; it does not change your price. We do not send the
          partner your report or your contact details.
        </p>
        <p>
          If you register as a referral partner, we keep your name, business,
          phone number and email to manage referrals and any referral fees.
        </p>

        <h2>Storage and retention</h2>
        <p>
          We take reasonable steps to protect personal information from
          misuse, loss and unauthorised access. Enquiries that do not proceed
          are deleted once they are no longer needed. Inspection, report and
          payment records are kept for as long as we are required to keep
          them for legal, insurance and accounting purposes.
        </p>

        <h2>Access, correction and questions</h2>
        <p>
          You may ask for a copy of the personal information we hold about
          you, ask us to correct it, or ask us to delete an enquiry that did
          not proceed to an inspection. Contact{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <h2>Complaints</h2>
        <p>
          If you believe we have mishandled your personal information, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the
          details. We will acknowledge your complaint and aim to respond
          within 30 days. If you are not satisfied with our response, you may
          contact the Office of the Australian Information Commissioner at
          oaic.gov.au.
        </p>

        <h2>Changes to this notice</h2>
        <p>
          We may update this notice as our services change. The current
          version is always published on this page.
        </p>

        <p className="credential-note">Last updated: 19 October 2026.</p>
      </div>
    </main>
  )
}
