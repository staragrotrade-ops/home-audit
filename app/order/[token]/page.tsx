import type { Metadata } from 'next'
import { BookingDetailsForm } from '@/components/order/booking-details-form'
import { FloorplanUpload } from '@/components/order/floorplan-upload'
import { ReportDownload } from '@/components/order/report-download'
import { TranslationOption } from '@/components/order/translation-option'
import { TRANSLATION_FEE_CENTS } from '@/lib/translation'
import { AgreementText } from '@/components/agreement/agreement-text'
import { AgreementConsent } from '@/components/order/agreement-consent'
import { jobIdForToken } from '@/lib/access-tokens'
import { INSPECTION_TYPE_LABELS, STAGE_LABELS } from '@/lib/admin-format'
import { loadAgreementStatus } from '@/lib/agreement-store'
import { ACCESS_CHOICE_LABELS, BUYER_SITUATION_LABELS, type AccessChoice, type BuyerSituation } from '@/lib/booking-options'
import {
  AGREEMENT_KEY_POINTS,
  AGREEMENT_PATH,
  AGREEMENT_TITLE,
  AGREEMENT_VERSION,
  agreementVersionLabel,
} from '@/lib/inspection-agreement'
import { inspectionDateLabel } from '@/lib/order-emails'
import { addressOf, centsOf, instantPriceExpired, isPayable, loadOrder, type OrderJob } from '@/lib/orders'
import { formatAud } from '@/lib/pricing'
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/lib/site'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: 'Your inspection order | Home Audit' },
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

function serviceLabel(job: OrderJob) {
  if (job.service_family === 'new_home') {
    return `New home inspection (${job.new_home_stages.map((stage) => STAGE_LABELS[stage] || stage).join(', ')})`
  }
  return `${INSPECTION_TYPE_LABELS[job.inspection_type || ''] || 'Building'} inspection`
}

function acceptedLabel(iso: string) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

// The main points, the full agreement (folded) and the tick box.
function AgreementPanel({ token, mode, label }: { token: string; mode: 'pay' | 'accept'; label: string }) {
  return (
    <div className="agreement-panel">
      <h3>{AGREEMENT_TITLE}</h3>
      <p>
        {mode === 'pay'
          ? 'Please read the agreement before you pay. The main points are:'
          : 'Before we book the inspection, please read and accept the agreement. The main points are:'}
      </p>
      <ul>
        {AGREEMENT_KEY_POINTS.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <details className="agreement-full">
        <summary>Read the full agreement</summary>
        <div className="agreement-scroll">
          <AgreementText headingLevel={4} />
        </div>
      </details>
      <p className="order-hint">
        You can also <a href={AGREEMENT_PATH} target="_blank" rel="noopener">open the agreement on its own page</a>{' '}
        to print or save it.
      </p>
      <AgreementConsent
        token={token}
        version={AGREEMENT_VERSION}
        versionLabel={agreementVersionLabel()}
        mode={mode}
        label={label}
      />
    </div>
  )
}

function Expired() {
  return (
    <main id="main-content" className="quote-page">
      <div className="container order-page">
        <h1>This link has expired</h1>
        <p>
          Please email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will send you a new
          one.
        </p>
      </div>
    </main>
  )
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ pending?: string }>
}) {
  const { token } = await params
  const { pending } = await searchParams
  const supabase = getSupabaseAdmin()
  if (!supabase) return <Expired />

  const jobId = await jobIdForToken(supabase, token)
  const job = jobId ? await loadOrder(supabase, jobId) : null
  if (!job) return <Expired />

  const customer = job.customer_snapshot || {}
  const paid = job.payment_status === 'paid'
  const transfer = job.intake_channel === 'report_transfer'
  const agreement = await loadAgreementStatus(supabase, job.id)
  // Counted defensively: before the floorplan migration the table is missing.
  const { count: customerFloorplans } = paid
    ? await supabase
        .from('job_floorplans')
        .select('id', { count: 'exact', head: true })
        .eq('job_id', job.id)
        .eq('source', 'customer')
        .eq('status', 'active')
    : { count: 0 }
  const total = centsOf(job.quote_total)
  // Read separately so the page still works before the vouchers migration.
  const { data: voucherRow } = await supabase
    .from('jobs')
    .select('voucher_code,voucher_discount_cents')
    .eq('id', job.id)
    .maybeSingle()
  const voucherCents = Number(voucherRow?.voucher_discount_cents || 0)
  // Read separately so the page still works before the translation migration.
  const { data: translationRow } = await supabase
    .from('jobs')
    .select('translation_zh,translation_fee')
    .eq('id', job.id)
    .maybeSingle()
  const translationZh = Boolean(translationRow?.translation_zh)
  // The report the customer can download (sent to them and paid). Read
  // defensively: before the report delivery migration the columns are missing.
  const { data: sentReport } = paid
    ? await supabase
        .from('inspection_reports')
        .select('*')
        .eq('job_id', job.id)
        .eq('status', 'issued')
        .not('sent_at', 'is', null)
        .order('issued_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  return (
    <main id="main-content" className="quote-page">
      <div className="container order-page">
        <p className="eyebrow">Order {job.public_reference}</p>
        <h1>{addressOf(job) || 'Your inspection'}</h1>
        <p className="order-service">{serviceLabel(job)}</p>

        {job.status === 'cancelled' ? (
          <section className="quote-panel">
            <h2>This order has been cancelled</h2>
            <p>
              Questions? Call <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a> or email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </p>
          </section>
        ) : !paid && job.quote_status !== 'quoted' ? (
          <section className="quote-panel">
            <h2>We are checking the price</h2>
            <p>
              This property needs a quick check before we can confirm the price. We will email{' '}
              {customer.email || 'you'} with the price and a link to pay.
            </p>
          </section>
        ) : !paid ? (
          <section className="quote-panel">
            <h2>Your price</h2>
            <dl className="order-price">
              <dt>{transfer ? 'Report transfer' : 'Inspection'}</dt>
              <dd>{formatAud(centsOf(job.quote_subtotal))}</dd>
              <dt>GST</dt>
              <dd>{formatAud(centsOf(job.gst))}</dd>
              <dt>Total</dt>
              <dd>
                <strong>{formatAud(total)}</strong>
              </dd>
            </dl>
            {voucherCents > 0 && (
              <p className="order-hint">
                Includes your {formatAud(voucherCents)} voucher
                {voucherRow?.voucher_code ? ` (${voucherRow.voucher_code})` : ''}.
              </p>
            )}
            {transfer ? (
              <p>
                This is a copy of an inspection report already carried out at this property. After payment the
                report is issued in your name and emailed to you straight away.
              </p>
            ) : (
              <p>
                After payment you can tell us who to contact for access. We then arrange a time and email
                you the confirmed date. We provide a digital copy of the report after the inspection.
              </p>
            )}
            {isPayable(job) && !transfer && job.service_family === 'existing_home' && (
              <TranslationOption token={token} on={translationZh} feeLabel={formatAud(TRANSLATION_FEE_CENTS)} />
            )}
            {translationZh && !(isPayable(job) && !transfer && job.service_family === 'existing_home') && (
              <p className="order-hint">
                Includes the Chinese translation ({formatAud(Math.round(Number(translationRow?.translation_fee || 0) * 100))}).
              </p>
            )}
            {isPayable(job) && <AgreementPanel token={token} mode="pay" label="Agree and pay" />}
            {pending && (
              <p className="order-hint">
                If you have just paid, the payment may take a minute to show. Refresh this page shortly.
              </p>
            )}
            <p className="order-hint">Payment is processed securely by Stripe.</p>
          </section>
        ) : (
          <>
            {sentReport && (
              <section className="quote-panel order-report" id="report">
                <h2>Your inspection report</h2>
                <p>
                  Report {sentReport.version_label}, issued {acceptedLabel(sentReport.issued_at)}. Start with the
                  Summary page: it lists any major defects and safety hazards and the repairs grouped by trade.
                </p>
                <ReportDownload token={token} chinese={Boolean(sentReport.zh_path)} />
                {translationZh && !sentReport.zh_path && (
                  <p className="order-hint">The Chinese translation will be added here shortly.</p>
                )}
                <p className="order-hint">
                  Questions about the report? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> before
                  you sign a contract or let a cooling-off, finance or building condition date pass.
                </p>
              </section>
            )}
            <section className="quote-panel">
              <h2>Payment received</h2>
              <p>
                Thank you{customer.first_name ? `, ${customer.first_name}` : ''}. We have received{' '}
                {formatAud(total)}.
              </p>
              {transfer ? (
                <p>
                  {sentReport
                    ? 'The report has been issued in your name.'
                    : 'Your report is being prepared and will be emailed to you shortly.'}
                </p>
              ) : job.confirmed_start && job.booking_notified_at ? (
                <p>
                  <strong>Inspection date: {inspectionDateLabel(job.confirmed_start)}</strong>
                </p>
              ) : (
                <p>We will email you once the inspection date is confirmed.</p>
              )}
              {agreement.accepted && agreement.version && agreement.acceptedAt && (
                <p className="order-hint">
                  You accepted the <a href={AGREEMENT_PATH}>{AGREEMENT_TITLE}</a> (version{' '}
                  {agreementVersionLabel(agreement.version)}) on {acceptedLabel(agreement.acceptedAt)}.
                </p>
              )}
            </section>

            {transfer ? null : !agreement.accepted ? (
              <section className="quote-panel">
                <h2>Next: the inspection agreement</h2>
                <AgreementPanel token={token} mode="accept" label="Accept the agreement" />
              </section>
            ) : (
            <section className="quote-panel">
              <h2>{job.details_submitted_at ? 'Your booking details' : 'Next: a few details for the booking'}</h2>
              {job.details_submitted_at && (
                <ul className="order-summary">
                  {job.buyer_situation && (
                    <li>{BUYER_SITUATION_LABELS[job.buyer_situation as BuyerSituation]}</li>
                  )}
                  {job.access_choice && (
                    <li>
                      Contact for access: {ACCESS_CHOICE_LABELS[job.access_choice as AccessChoice]}
                      {job.access_choice === 'other' && job.access_other_name
                        ? ` (${job.access_other_name})`
                        : ''}
                    </li>
                  )}
                </ul>
              )}
              {!job.booking_notified_at && (
                <BookingDetailsForm
                  token={token}
                  initial={{
                    buyerSituation: job.buyer_situation || '',
                    accessChoice: job.access_choice || '',
                    otherName: job.access_other_name || '',
                    otherPhone: job.access_other_phone || '',
                  }}
                />
              )}
            </section>
            )}

            {paid && !transfer && agreement.accepted && job.service_family === 'existing_home' && (
              <section className="quote-panel">
                <h2>Floorplan</h2>
                <FloorplanUpload token={token} existing={customerFloorplans || 0} />
              </section>
            )}
          </>
        )}

        <p className="order-hint">
          Questions? Call <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a> or email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </main>
  )
}
