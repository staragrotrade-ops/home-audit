import Image from 'next/image'
import Link from 'next/link'

// Real findings from Home Audit inspections, shown as a photo card with a
// short account and a quote button. Photos carry the Home Audit watermark;
// third-party brands and device models are blurred.

type CaseImage = { src: string; alt: string; width: number; height: number; label?: string }

type CaseStudyProps = {
  eyebrow: string
  heading: string
  steps: [string, string][]
  body: string[]
  note?: string
  cta: { href: string; label: string }
  images: CaseImage[]
  variant?: 'full' | 'home'
}

function CaseStudy({ eyebrow, heading, steps, body, note, cta, images, variant = 'full' }: CaseStudyProps) {
  const Heading = variant === 'home' ? 'h2' : 'h3'
  const pair = images.length > 1
  return (
    <figure className={`case-card case-card-${variant}${pair ? ' case-card-pair' : ''}`}>
      <div className="case-card-images">
        {images.map((image) => (
          <div className="case-card-image" key={image.src}>
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes={pair ? '(max-width: 900px) 100vw, 360px' : '(max-width: 900px) 100vw, 360px'}
            />
            {image.label && <span className="case-card-label">{image.label}</span>}
          </div>
        ))}
      </div>
      <figcaption className="case-card-copy">
        <p className="eyebrow">{eyebrow}</p>
        <Heading>{heading}</Heading>
        <ol className="case-card-steps">
          {steps.map(([title, text]) => (
            <li key={title}>
              <strong>{title}</strong> {text}
            </li>
          ))}
        </ol>
        {body.map((text) => (
          <p key={text}>{text}</p>
        ))}
        {note && <p className="case-card-note">{note}</p>}
        <Link className="button" href={cta.href}>
          {cta.label}
        </Link>
      </figcaption>
    </figure>
  )
}

// Building and pest: a cold spot on a ground-floor ceiling, confirmed as
// water from a leak upstairs. Thermal imaging is an extra check only
// (Inspection Agreement clause 5.1(w)). lang="zh" is the same case for the
// Chinese pages (归处).
export function ThermalCaseStudy({ variant = 'full', lang = 'en' }: { variant?: 'full' | 'home'; lang?: 'en' | 'zh' }) {
  const image = {
    src: '/case-study-thermal-ceiling-leak.webp',
    width: 900,
    height: 1200,
  }
  if (lang === 'zh') {
    return (
      <CaseStudy
        variant={variant}
        eyebrow="来自最近的一次房屋 + 白蚁检查"
        heading="看起来没问题的天花板，藏着楼上的漏水。"
        steps={[
          ['看起来正常。', '一楼天花板没有水渍，也看不出损坏。'],
          ['发现冷点。', '热成像仪显示有一块比周围天花板低约 1.4 °C。'],
          ['确认有水。', '湿度计确认这个位置有水，水来自楼上的地面。'],
        ]}
        body={['这个发现连同照片写进了书面报告。买家用它重新议价。']}
        note="在条件允许且有必要时，验房师可能会用热成像作为辅助检查。"
        cta={{ href: '/zh/quote?service=building-and-pest', label: '获取验房报价' }}
        images={[{ ...image, alt: '热成像仪显示一楼天花板上的冷点，原因是楼上漏水' }]}
      />
    )
  }
  return (
    <CaseStudy
      variant={variant}
      eyebrow="From a recent building & pest inspection"
      heading="A ceiling that looked fine was hiding a leak from upstairs."
      steps={[
        ['Looked normal.', 'The ground-floor ceiling had no stain or visible damage.'],
        ['Cold spot.', 'A thermal camera showed a patch about 1.4 °C cooler than the ceiling around it.'],
        ['Water confirmed.', 'A moisture meter confirmed water in that spot. It was coming from the floor above.'],
      ]}
      body={['The finding went into the written report, with photos. The buyer used it to renegotiate the price.']}
      note="Where conditions allow and it is necessary, our inspector may use thermal imaging as an extra check."
      cta={{ href: '/quote?service=building-and-pest', label: 'Get a quote' }}
      images={[
        {
          ...image,
          alt: 'Thermal camera showing a cold spot on a ground-floor ceiling, caused by a water leak from the floor above',
        },
      ]}
    />
  )
}

// New home: AAC (Hebel) wall panels without the waterproof coating at the
// base. Once rendered, the missing coating is very hard to see.
export function HebelBaseCaseStudy() {
  return (
    <CaseStudy
      eyebrow="From a recent new home inspection"
      heading="Hebel walls missing the waterproof coating at the base."
      steps={[
        ['Done right.', 'On the left, the base of the Hebel panels has a pink waterproof coating.'],
        ['Missing.', 'On the right, the base of the panels had no coating at all.'],
        [
          'Why it matters.',
          'Without the coating, the panels can draw moisture up from the ground over time.',
        ],
      ]}
      body={[
        'Once the render goes on, the base of the wall is covered and this is very hard to see. The best time to find it is before rendering.',
      ]}
      cta={{ href: '/quote?service=new-home', label: 'Get a quote' }}
      images={[
        {
          src: '/case-study-hebel-base-coated.webp',
          alt: 'Hebel wall panels with a pink waterproof coating along the base of the wall',
          width: 900,
          height: 600,
          label: 'Done right: coating at the base',
        },
        {
          src: '/case-study-hebel-base-uncoated.webp',
          alt: 'Hebel wall panels with no waterproof coating along the base of the wall',
          width: 900,
          height: 600,
          label: 'Missing: no coating at the base',
        },
      ]}
    />
  )
}

// New home frame stage: warped studs that would leave the plasterboard
// uneven. Fixed by the builder within a week of the report.
export function FrameStudCaseStudy() {
  return (
    <CaseStudy
      eyebrow="From a recent frame inspection"
      heading="Warped studs found before the plasterboard went on."
      steps={[
        ['Gaps.', 'A long level held across the studs showed gaps where studs were out of line.'],
        ['Warped stud.', 'One stud had bent out of line with the rest of the wall.'],
        [
          'Why it matters.',
          'Plasterboard fixed to warped studs can end up uneven or wavy. Once the plasterboard is on, this is almost impossible to fix.',
        ],
      ]}
      body={['The report went to the builder, and the problem was fixed within a week.']}
      cta={{ href: '/quote?service=new-home', label: 'Get a quote' }}
      images={[
        {
          src: '/case-study-frame-gaps.webp',
          alt: 'A level held across wall studs at frame stage, showing gaps where studs are out of line',
          width: 900,
          height: 1200,
          label: 'Gaps between the level and the studs',
        },
        {
          src: '/case-study-frame-stud-warped.webp',
          alt: 'A level held against a warped timber stud at frame stage',
          width: 900,
          height: 1200,
          label: 'A warped stud',
        },
      ]}
    />
  )
}
