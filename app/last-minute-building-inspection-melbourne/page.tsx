import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { pageMetadata } from '@/lib/metadata'
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF, SITE_URL } from '@/lib/site'

// A test page for a narrow search: buyers (and their agents) who need someone
// at an open-for-inspection before auction, at short notice. Booked by phone
// or email and paid by invoice; it does not use the quote form or Stripe.
// If nobody books it, the owner may remove it later.

const PATH = '/last-minute-building-inspection-melbourne'

export const metadata = pageMetadata({
  title: 'Last-Minute Building Inspection Melbourne | Before Auction',
  description:
    'Short-notice building walk-through before an auction in Melbourne’s south-east. About 30 minutes. $850 + GST, or $1,100 + GST with a short written summary. Call to book.',
  path: PATH,
})

const EMAIL_SUBJECT = 'Last-minute inspection request'
const EMAIL_BODY = [
  'Property address:',
  'Open-for-inspection date and time:',
  'Auction date and time:',
  'Option (walk-through only / with written summary):',
  'Your name and phone:',
  'Agent name and phone (if known):',
].join('\n')
const EMAIL_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(EMAIL_BODY)}`

const tiers = [
  {
    name: 'Walk-through only',
    price: '$850 + GST',
    total: '$935 incl. GST',
    points: [
      'About 30 minutes on site, usually at the open for inspection',
      'We tell you what we see as we go, and answer your questions',
      'No written report',
    ],
  },
  {
    name: 'Walk-through with a short written summary',
    price: '$1,100 + GST',
    total: '$1,210 incl. GST',
    points: [
      'The same 30-minute walk-through',
      'A short written summary of the main items we saw, with photos',
      'Sent by email. We confirm the timing when you book',
    ],
  },
]

const terms = [
  'This is a limited visual walk-through. It is not a building inspection to AS 4349.1 and it is not a timber pest inspection.',
  'The time on site is short, and the access is set by the agent and the vendor. Other buyers are often in the home. Roof space, subfloor and roof exterior are usually not inspected. Anything we could not see is not covered.',
  'With the walk-through only option, our comments are given on site. There is no written report, and later questions are not part of the service.',
  'The written summary lists the main items we noticed in the time available. It is not a full list of defects.',
  'What we say or write is general information to help you ask better questions. Do not rely on it as the only basis for bidding, buying or setting a price. If you have the time, book a full building and pest inspection.',
  'As far as the law allows, our liability is limited to the fee you paid. Nothing in these terms takes away your rights under the Australian Consumer Law.',
  'We send an invoice when we confirm the booking. It is paid by bank transfer before the inspection.',
  'If we have to cancel, you get a full refund. Once the inspector has set out for the property, the fee is not refundable, including when the agent or vendor does not give access.',
]

const faqs = [
  {
    question: 'Can you inspect a house today or tomorrow before the auction?',
    answer:
      'Sometimes. Call us with the address, the open-for-inspection time and the auction time. If an inspector is free and the property is in Melbourne’s south-east, we confirm the booking and send an invoice.',
  },
  {
    question: 'Is this the same as a building and pest inspection?',
    answer:
      'No. It is a 30-minute walk-through with limited access. It is not done to AS 4349.1, it does not include a timber pest inspection, and the roof space and subfloor are usually not entered. A full building and pest inspection gives a complete written report.',
  },
  {
    question: 'Which option should I choose?',
    answer:
      'Choose the walk-through only if you want an experienced person beside you at the open for inspection. Choose the written summary if you want the main items in writing, with photos, to look at again before the auction.',
  },
  {
    question: 'Can I rely on it to decide how much to bid?',
    answer:
      'It helps you ask better questions, but it should not be the only basis for your decision. The access and time are too limited for that. If you have a few days, book a full building and pest inspection.',
  },
  {
    question: 'How do I pay?',
    answer:
      'We email an invoice when the booking is confirmed. Payment is by bank transfer before the inspection.',
  },
  {
    question: 'Which areas do you cover?',
    answer:
      'Melbourne’s south-east only. Call us with the address and we will tell you straight away if we can get there in time.',
  },
]

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Building & Pest Inspections',
          item: `${SITE_URL}/building-and-pest-inspections`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Last-Minute Building Inspection',
          item: `${SITE_URL}${PATH}`,
        },
      ],
    },
    {
      '@type': 'Service',
      name: 'Last-Minute Building Inspection Before Auction',
      alternateName: 'Express pre-auction building walk-through',
      serviceType: 'Short-notice limited visual building walk-through',
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: { '@type': 'Place', name: 'South-east Melbourne, Victoria' },
      url: `${SITE_URL}${PATH}`,
      offers: [
        {
          '@type': 'Offer',
          name: 'Walk-through only',
          price: '935.00',
          priceCurrency: 'AUD',
        },
        {
          '@type': 'Offer',
          name: 'Walk-through with a short written summary',
          price: '1210.00',
          priceCurrency: 'AUD',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
}

export default function LastMinuteBuildingInspectionPage() {
  return (
    <main id="main-content">
      <JsonLd data={structuredData} />
      <section className="page-hero">
        <div className="container page-hero-grid">
          <div>
            <p className="eyebrow">Short notice · Before auction</p>
            <h1>Need a last-minute building inspection before auction?</h1>
            <p>
              Auction this week and no inspection yet? We can come to the open
              for inspection and walk through the home with you. It takes about
              30 minutes. We cover Melbourne’s south-east only.
            </p>
            <div className="button-row">
              <a className="button" href={CONTACT_PHONE_HREF}>
                Call {CONTACT_PHONE}
              </a>
              <a className="button button-secondary" href={EMAIL_HREF}>
                Email the details
              </a>
            </div>
          </div>
          <div className="page-hero-aside">
            <strong>From $850 + GST</strong>
            <span>About 30 minutes · Invoice and bank transfer · Subject to availability</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container content-grid">
          <aside>
            <h2>Have these ready when you call</h2>
            <ul>
              <li>Property address</li>
              <li>Open-for-inspection date and time</li>
              <li>Auction date and time</li>
              <li>Which option you want</li>
              <li>Agent name and phone, if you have them</li>
            </ul>
          </aside>

          <div className="prose">
            <h2>What this service is</h2>
            <p className="answer-summary">
              A registered building inspector walks through the home with you,
              usually at the open for inspection, and points out visible
              issues worth asking about before you bid. It is quick and it is
              limited. It is for buyers who have run out of time for a full
              inspection.
            </p>

            <h2>Two options</h2>
            <div className="scope-grid">
              {tiers.map((tier) => (
                <div className="scope-item" key={tier.name}>
                  <strong>{tier.name}</strong>
                  <span>
                    {tier.price} ({tier.total})
                  </span>
                  <ul>
                    {tier.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <h2>What it is not</h2>
            <p>
              It is not a building inspection to AS 4349.1, and it is not a
              timber pest inspection. In 30 minutes, with the agent setting the
              access and other buyers walking through, we cannot check
              everything. Think of it as an informed second opinion, not a
              full report.
            </p>
            <p>
              If you have a few days before the auction, a{' '}
              <Link className="text-link" href="/building-and-pest-inspections">
                full building and pest inspection
              </Link>{' '}
              costs less and covers much more.
            </p>

            <h2 id="express-terms">Terms for this service</h2>
            <p>
              These terms apply to the last-minute walk-through only. Our full
              booking service uses the{' '}
              <Link className="text-link" href="/inspection-agreement">
                Inspection Agreement
              </Link>{' '}
              instead.
            </p>
            <ol>
              {terms.map((term) => (
                <li key={term}>{term}</li>
              ))}
            </ol>

            <h2>For real estate agents</h2>
            <p>
              A buyer wants an inspection and the auction is on Saturday? Give
              them our number. We tell them straight away whether we can make
              it, and we follow your access arrangements on the day.
            </p>

            <div className="faq-list content-faqs">
              {faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}</summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>

            <div className="callout">
              <h3>Auction coming up?</h3>
              <p>
                Call us with the address and times. If we can make it, we
                confirm by email and send the invoice.
              </p>
              <div className="button-row">
                <a className="button" href={CONTACT_PHONE_HREF}>
                  Call {CONTACT_PHONE}
                </a>
                <a className="button button-secondary" href={EMAIL_HREF}>
                  Email the details
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
