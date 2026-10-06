import Link from 'next/link'
import { COMPANY_ACN, COMPANY_NAME, CONTACT_EMAIL } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">Home Audit</div>
          <p>
            Independent building inspections for existing homes and new builds
            across Melbourne and supported Victorian locations.
          </p>
        </div>

        <div>
          <h2>Inspections</h2>
          <Link href="/building-and-pest-inspections">Building &amp; Pest</Link>
          <Link href="/new-home-inspections">New Home Inspections</Link>
          <Link href="/service-areas">Service areas</Link>
          <Link href="/guides">Buyer guides</Link>
          <a href="https://ownerbuilderinspection.melbourne">
            Owner Builder 137B
          </a>
        </div>

        <div>
          <h2>Information</h2>
          <Link href="/quote">Get a quote</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <Link href="/about">About Home Audit</Link>
          <Link href="/credentials">Credentials &amp; insurance</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>
          {COMPANY_NAME} · ACN {COMPANY_ACN}
        </span>
        <span>Victoria, Australia</span>
      </div>
    </footer>
  )
}
