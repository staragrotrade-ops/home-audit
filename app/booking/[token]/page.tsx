import type { Metadata } from 'next'
import { AgentResponse } from '@/components/booking/agent-response'
import { jobAddress, loadJobContact } from '@/lib/admin-jobs'
import { loadBookingRequest, requestIsOpen } from '@/lib/booking-requests'
import { slotLabel } from '@/lib/order-emails'
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/lib/site'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { absolute: 'Inspection access | Home Audit' },
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

function Contact() {
  return (
    <p>
      Questions? Call <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a> or email{' '}
      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
    </p>
  )
}

function Closed({ heading, text }: { heading: string; text: string }) {
  return (
    <main id="main-content" className="quote-page">
      <div className="container order-page">
        <h1>{heading}</h1>
        <p>{text}</p>
        <Contact />
      </div>
    </main>
  )
}

// The page the agent (or other access contact) opens from our email or text.
// It shows only the property and the proposed times.
export default async function BookingRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = getSupabaseAdmin()
  const request = supabase ? await loadBookingRequest(supabase, token) : null
  if (!supabase || !request) {
    return <Closed heading="This link has expired" text="Please contact us to arrange a time." />
  }

  const job = await loadJobContact(supabase, request.job_id).catch(() => null)
  if (!job || job.status === 'cancelled') {
    return <Closed heading="This request has closed" text="The inspection is no longer needed. Thank you." />
  }
  const address = jobAddress(job)

  if (request.status === 'confirmed' && request.chosen_start) {
    return (
      <Closed
        heading="Thank you – the time is confirmed"
        text={`${address}: ${slotLabel(request.chosen_start)}.`}
      />
    )
  }
  if (request.status === 'declined') {
    return <Closed heading="Thank you" text="We have your note and will be in touch to find another time." />
  }
  if (!requestIsOpen(request)) {
    return (
      <Closed
        heading="This request has closed"
        text="The time may already have been arranged. If not, please contact us."
      />
    )
  }

  return (
    <main id="main-content" className="quote-page">
      <div className="container order-page">
        <p className="eyebrow">Inspection access request</p>
        <h1>{address || 'Inspection'}</h1>
        {request.service_label && <p className="order-service">{request.service_label}</p>}
        <section className="quote-panel">
          <p>
            Home Audit has been engaged by the buyer to inspect this property. Please choose a time that
            works for access.
          </p>
          <AgentResponse
            token={token}
            slots={request.slots.map((slot) => ({ iso: new Date(slot).toISOString(), label: slotLabel(slot) }))}
          />
        </section>
        <Contact />
      </div>
    </main>
  )
}
