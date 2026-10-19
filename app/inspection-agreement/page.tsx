import type { Metadata } from 'next'
import Link from 'next/link'
import { AgreementText } from '@/components/agreement/agreement-text'
import { AGREEMENT_PATH, AGREEMENT_TITLE, agreementVersionLabel } from '@/lib/inspection-agreement'
import { COMPANY_ACN, COMPANY_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Inspection Agreement',
  description: 'The agreement that applies to Home Audit building, timber pest and new home inspections.',
  alternates: { canonical: AGREEMENT_PATH },
  robots: { index: false, follow: true },
}

export default function InspectionAgreementPage() {
  return (
    <main id="main-content" className="section legal-page">
      <div className="container prose">
        <p className="eyebrow">Terms</p>
        <h1>{AGREEMENT_TITLE}</h1>
        <p>
          {COMPANY_NAME} (ACN {COMPANY_ACN}), trading as Home Audit. This is the agreement for every
          inspection booked through this website. You accept it on your order page before you pay.
        </p>
        <p className="credential-note">Version {agreementVersionLabel()}.</p>
        <AgreementText />
        <p>
          The website terms are on the <Link href="/terms">terms page</Link>. How we handle personal
          information is in the <Link href="/privacy">privacy notice</Link>.
        </p>
      </div>
    </main>
  )
}
