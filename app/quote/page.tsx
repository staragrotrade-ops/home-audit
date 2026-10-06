import { QuoteFlow } from '@/components/quote-flow'
import { pageMetadata } from '@/lib/metadata'
import { CONTACT_EMAIL } from '@/lib/site'

export const metadata = pageMetadata({
  title: 'Inspection Quote',
  description:
    'Request a quote for a Building & Pest or New Home inspection in Melbourne and supported Victorian locations.',
  path: '/quote',
  index: false,
})

type QuotePageProps = {
  searchParams: Promise<{ service?: string }>
}

export default async function QuotePage({ searchParams }: QuotePageProps) {
  const { service } = await searchParams
  const initialService =
    service === 'new-home'
      ? ('new_home' as const)
      : service === 'building-and-pest'
        ? ('existing_home' as const)
        : ('' as const)

  return (
    <main id="main-content" className="quote-page">
      <div className="container">
        <div className="quote-heading">
          <p className="eyebrow">Inspection quote</p>
          <h1>Start with the property. We’ll take it from there.</h1>
          <p>
            Your answers are saved on this device as you move through the form.
            Dates remain preferences until confirmed.
          </p>
          <p className="quote-contact">
            Prefer email? Write to{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </div>
        <QuoteFlow
          initialService={initialService}
          submissionEnabled={process.env.QUOTE_SUBMISSION_ENABLED === 'true'}
        />
      </div>
    </main>
  )
}
