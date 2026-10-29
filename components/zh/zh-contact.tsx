import Link from 'next/link'
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/lib/site'

// The contact block at the end of each Chinese page.
export function ZhContact({
  title = '先看清房子，再安心向前。',
  text,
  quote = true,
  emailSubject,
  note = '付款页面和验房协议目前是英文，有不明白的地方欢迎来电或发邮件。',
}: {
  title?: string
  text: string
  /** Show the button to the Chinese quote form. */
  quote?: boolean
  /** Opens an email with this subject instead of the quote form. */
  emailSubject?: string
  note?: string
}) {
  const mailHref = emailSubject
    ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(emailSubject)}`
    : `mailto:${CONTACT_EMAIL}`

  return (
    <section className="zh-section zh-contact" id="contact" aria-labelledby="zh-contact-title">
      <p className="zh-eyebrow">联系我们</p>
      <h2 id="zh-contact-title">{title}</h2>
      <p>{text}</p>
      <div className="zh-hero-actions">
        {quote ? (
          <Link className="button" href="/zh/quote">
            获取验房报价 <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <a className="button" href={mailHref}>
            发邮件说明情况 <span aria-hidden="true">→</span>
          </a>
        )}
        <a className="text-link" href={CONTACT_PHONE_HREF}>
          致电 {CONTACT_PHONE}
        </a>
      </div>
      <p className="zh-contact-lines">
        电话 <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a> · 邮箱 <a href={mailHref}>{CONTACT_EMAIL}</a>
      </p>
      {note && <p className="zh-note">{note}</p>}
    </section>
  )
}
