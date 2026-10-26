import type { Metadata } from 'next'
import { TransferForm } from '@/components/transfer/transfer-form'
import { INSPECTION_TYPE_LABELS } from '@/lib/admin-format'
import { formatAud } from '@/lib/pricing'
import { loadTransferOffer, melbourneDate } from '@/lib/report-transfer'
import { CONTACT_EMAIL, SITE_URL } from '@/lib/site'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: 'Inspection report for this property | Home Audit' },
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

// Public page behind the QR code an agent passes on. It shows only the
// address, the inspection date and the price – never the report or a name.
export default async function TransferPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = getSupabaseAdmin()
  const offer = supabase ? await loadTransferOffer(supabase, code) : null

  return (
    <main id="main-content" className="quote-page">
      <div className="container order-page">
        {!offer ? (
          <>
            <h1>This link is not valid</h1>
            <p>
              The report for this property is not available here. Book your own inspection at{' '}
              <a href={`${SITE_URL}/quote`}>homeaudit.com.au/quote</a>.
            </p>
          </>
        ) : (
          <>
            <p className="eyebrow">Inspection report available</p>
            <h1>{offer.address}</h1>
            <p className="order-service">
              {offer.serviceFamily === 'new_home'
                ? 'New home inspection report'
                : `${INSPECTION_TYPE_LABELS[offer.inspectionType || ''] || 'Building'} inspection report`}
              {' · '}inspected {melbourneDate(offer.inspectedAt)}
            </p>
            {offer.open ? (
              <section className="quote-panel">
                <h2>Get this report in your name</h2>
                <p>
                  A Home Audit inspector inspected this property on {melbourneDate(offer.inspectedAt)}. For{' '}
                  <strong>{formatAud(offer.priceCents)}</strong> (incl. GST) the full report – defects, photos,
                  floorplans and recommendations – is issued in your name and emailed to you as soon as you
                  have paid. You can rely on it as our client under the Inspection Agreement.
                </p>
                <ul className="order-summary">
                  <li>The report describes the property on the inspection day.</li>
                  <li>Available until {melbourneDate(offer.closesAt)} (30 days after the inspection).</li>
                  <li>Next you read and accept the Inspection Agreement, then pay securely by card.</li>
                </ul>
                <TransferForm code={code} priceLabel={formatAud(offer.priceCents)} />
              </section>
            ) : (
              <section className="quote-panel">
                <h2>The transfer period has ended</h2>
                <p>
                  This report was prepared more than 30 days ago. Conditions may have changed, so please book a
                  new inspection at <a href={`${SITE_URL}/quote`}>homeaudit.com.au/quote</a>.
                </p>
              </section>
            )}
            <p className="order-hint">
              Questions? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </>
        )}
      </div>
    </main>
  )
}
