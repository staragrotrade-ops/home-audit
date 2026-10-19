import { AGREEMENT_SECTIONS } from '@/lib/inspection-agreement'

// The full Inspection Agreement. Used on /inspection-agreement and inside the
// order page, so both always show the same text.
export function AgreementText({ headingLevel = 2 }: { headingLevel?: 2 | 3 | 4 }) {
  const Heading = headingLevel === 2 ? 'h2' : headingLevel === 3 ? 'h3' : 'h4'
  return (
    <>
      {AGREEMENT_SECTIONS.map((section) => (
        <section key={section.id} id={section.id} className="agreement-section">
          <Heading>{section.heading}</Heading>
          {section.blocks.map((block, index) =>
            typeof block === 'string' ? (
              <p key={index}>{block}</p>
            ) : (
              <ul key={index}>
                {block.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          )}
        </section>
      ))}
    </>
  )
}
