import Image from 'next/image'
import Link from 'next/link'

// A real finding from a building and pest inspection: a cold spot on a
// ground-floor ceiling, confirmed as water from a leak upstairs. Thermal
// imaging is an extra check only (Inspection Agreement clause 5.1(w)), so the
// copy must not suggest it is part of every inspection.
export function ThermalCaseStudy({ variant = 'full' }: { variant?: 'full' | 'home' }) {
  return (
    <figure className={`thermal-case thermal-case-${variant}`}>
      <div className="thermal-case-image">
        <Image
          src="/case-study-thermal-ceiling-leak.webp"
          alt="Thermal camera showing a cold spot on a ground-floor ceiling, caused by a water leak from the floor above"
          width={900}
          height={1200}
          sizes={variant === 'home' ? '(max-width: 900px) 100vw, 40vw' : '(max-width: 900px) 100vw, 360px'}
        />
      </div>
      <figcaption className="thermal-case-copy">
        <p className="eyebrow">From a recent building &amp; pest inspection</p>
        {variant === 'home' ? (
          <h2>A ceiling that looked fine was hiding a leak from upstairs.</h2>
        ) : (
          <h3>A ceiling that looked fine was hiding a leak from upstairs.</h3>
        )}
        <ol className="thermal-case-steps">
          <li>
            <strong>Looked normal.</strong> The ground-floor ceiling had no stain or visible damage.
          </li>
          <li>
            <strong>Cold spot.</strong> A thermal camera showed a patch about 1.4 °C cooler than the
            ceiling around it.
          </li>
          <li>
            <strong>Water confirmed.</strong> A moisture meter confirmed water in that spot. It was
            coming from the floor above.
          </li>
        </ol>
        <p>The finding went into the written report, with photos.</p>
        <p className="thermal-case-note">
          Where conditions allow, our inspector may use a thermal camera as an extra check. Thermal
          imaging is not part of every inspection.
        </p>
        <Link className="button" href="/quote?service=building-and-pest">
          Get a quote
        </Link>
      </figcaption>
    </figure>
  )
}
