import Link from 'next/link'
import { PRIMARY_NAV } from '@/lib/site'

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label="Home Audit home">
          <span className="brand-mark" aria-hidden="true">
            HA
          </span>
          <span className="brand-copy">
            <strong>Home Audit</strong>
            <small>Building · Pest · New Homes</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {PRIMARY_NAV.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link className="button button-small header-cta" href="/quote">
          Get a quote
        </Link>

        <details className="mobile-menu">
          <summary aria-label="Open navigation">Menu</summary>
          <nav aria-label="Mobile navigation">
            {PRIMARY_NAV.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link className="button" href="/quote">
              Get a quote
            </Link>
          </nav>
        </details>
      </div>
    </header>
  )
}
