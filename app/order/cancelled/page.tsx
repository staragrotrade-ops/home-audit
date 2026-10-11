import type { Metadata } from 'next'
import { CONTACT_EMAIL } from '@/lib/site'

export const metadata: Metadata = {
  title: { absolute: 'Payment not completed | Home Audit' },
  robots: { index: false, follow: false },
}

export default async function OrderCancelledPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string }>
}) {
  const { expired } = await searchParams
  return (
    <main id="main-content" className="quote-page">
      <div className="container order-page">
        <h1>{expired ? 'We could not open your order' : 'Payment not completed'}</h1>
        <p>
          {expired
            ? 'Please use the link in the email we sent you.'
            : 'No payment was taken. To pay later, use the link in the email we sent you, or go back to the previous page.'}
        </p>
        <p>
          Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </main>
  )
}
