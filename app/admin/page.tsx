import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Admin Pipeline',
  robots: { index: false, follow: false },
}

const columns = [
  {
    title: 'Quote received',
    jobs: [
      {
        address: 'South Yarra VIC 3141',
        customer: 'Sample customer',
        detail: 'Building & pest · Auction Friday',
        service: 'existing_home',
      },
    ],
  },
  {
    title: 'Awaiting payment',
    jobs: [
      {
        address: 'Mornington VIC 3931',
        customer: 'Sample customer',
        detail: 'Pre-purchase · Quote approved',
        service: 'existing_home',
      },
    ],
  },
  {
    title: 'Scheduling',
    jobs: [
      {
        address: 'Glen Waverley VIC 3150',
        customer: 'Sample customer',
        detail: 'Frame stage · Date flexible',
        service: 'new_home',
      },
    ],
  },
  {
    title: 'Confirmed',
    jobs: [
      {
        address: 'Cheltenham VIC 3192',
        customer: 'Sample customer',
        detail: 'PCI · 22 September',
        service: 'new_home',
      },
    ],
  },
]

// The sample pipeline is a design reference only. It stays unavailable (404)
// unless explicitly switched on for a local or preview build, and must never
// be enabled on the production domain before real authentication exists.
const adminPreviewEnabled = process.env.ADMIN_PREVIEW_ENABLED === 'true'

export default function AdminPage() {
  if (!adminPreviewEnabled) notFound()

  return (
    <main id="main-content" className="admin-page">
      <div className="container">
        <div className="admin-heading">
          <div>
            <h1>Inspection pipeline</h1>
            <p>One job record from quote through report delivery.</p>
          </div>
          <span className="preview-badge">Foundation preview · sample data only</span>
        </div>

        <div className="pipeline">
          {columns.map((column) => (
            <section className="pipeline-column" key={column.title}>
              <h2>{column.title}</h2>
              {column.jobs.map((job) => (
                <article className="job-card" data-service={job.service} key={job.address}>
                  <strong>{job.address}</strong>
                  <span>{job.customer}</span>
                  <small>{job.detail}</small>
                </article>
              ))}
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
