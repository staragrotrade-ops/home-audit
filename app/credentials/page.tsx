import { JsonLd } from '@/components/json-ld'
import { pageMetadata } from '@/lib/metadata'
import {
  COMPANY_NAME,
  INSPECTOR_NAME,
  INSPECTOR_REGISTRATION,
  INSPECTOR_REGISTRATION_CLASS,
  PRACTITIONER_SEARCH_URL,
  SITE_URL,
} from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Professional Credentials & Insurance',
  description:
    'Professional registration and insurance information for Home Audit building inspection services in Victoria.',
  path: '/credentials',
})

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/credentials#page`,
      name: 'Home Audit professional credentials and insurance',
      url: `${SITE_URL}/credentials`,
      about: { '@id': `${SITE_URL}/credentials#inspector` },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/credentials#inspector`,
      name: INSPECTOR_NAME,
      jobTitle: INSPECTOR_REGISTRATION_CLASS,
      affiliation: { '@id': `${SITE_URL}/#organization` },
      hasCredential: {
        '@type': 'EducationalOccupationalCredential',
        name: INSPECTOR_REGISTRATION_CLASS,
        credentialCategory: 'Victorian building practitioner registration',
        identifier: INSPECTOR_REGISTRATION,
      },
    },
  ],
}

export default function CredentialsPage() {
  return (
    <main id="main-content" className="section legal-page credentials-page">
      <JsonLd data={structuredData} />
      <div className="container prose">
        <p className="eyebrow">Business information</p>
        <h1>Professional credentials and insurance</h1>
        <p>
          Home Audit is operated by {COMPANY_NAME}. The following information
          records the professional registration supporting the inspection
          services offered through this website.
        </p>

        <dl className="credential-list">
          <div>
            <dt>Inspector</dt>
            <dd>{INSPECTOR_NAME}</dd>
          </div>
          <div>
            <dt>Registration class</dt>
            <dd>{INSPECTOR_REGISTRATION_CLASS}</dd>
          </div>
          <div>
            <dt>Registration number</dt>
            <dd>{INSPECTOR_REGISTRATION}</dd>
          </div>
          <div>
            <dt>Insurance</dt>
            <dd>Professional indemnity insurance maintained</dd>
          </div>
        </dl>

        <p>
          Practitioner registration can be checked through the Victorian
          Building and Plumbing Commission’s public search. Registration and
          insurance remain subject to their applicable renewal and policy
          terms.
        </p>
        <p>
          <a
            className="text-link"
            href={PRACTITIONER_SEARCH_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            Check a Victorian building practitioner
          </a>
        </p>
        <p className="credential-note">
          This information does not expand the inspection scope or replace the
          service-specific written agreement provided for a booking.
        </p>
      </div>
    </main>
  )
}
