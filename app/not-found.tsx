import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main-content" className="section legal-page">
      <div className="container prose">
        <p className="eyebrow">404</p>
        <h1>That page could not be found.</h1>
        <p>The address may have changed or the page may no longer be available.</p>
        <Link className="button" href="/">
          Return home
        </Link>
      </div>
    </main>
  )
}
