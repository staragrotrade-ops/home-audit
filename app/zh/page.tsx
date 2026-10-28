import Image from 'next/image'
import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { pageMetadata } from '@/lib/metadata'
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  INSPECTOR_REGISTRATION,
  SITE_URL,
  ZH_BRAND_NAME,
} from '@/lib/site'

// 归处 Home Audit — the Chinese home page. Same business, same services and
// the same quote system as the English site; the words are written for
// Chinese-speaking buyers rather than translated line by line.
// No prices on this page (owner decision, 29 October 2026).

export const metadata = pageMetadata({
  title: '墨尔本验房｜买房前房屋及白蚁检查、新房分阶段验收｜归处 Home Audit',
  description:
    '归处 Home Audit：墨尔本独立验房。买房前房屋及白蚁检查、拍卖前验房、新房打地基到交房（PCI）各阶段验收。注册验房师现场检查，带照片的书面报告，可加购完整中文报告。',
  path: '/zh',
  appendSiteName: false,
  locale: 'zh_CN',
  languages: { 'en-AU': '/', 'zh-Hans': '/zh', 'x-default': '/' },
})

const services = [
  {
    title: '买房前验房（房屋 + 白蚁）',
    text: '买二手房前，看清房屋的可见缺陷、潮湿迹象和白蚁风险，也写明哪些地方当天没法检查。',
    href: '/zh/quote?service=building-and-pest',
  },
  {
    title: '拍卖前验房',
    text: '拍卖买房没有冷静期。提交报价时写上拍卖日期，我们会尽量在拍卖前安排。',
    href: '/zh/quote?service=building-and-pest',
  },
  {
    title: '新房分阶段验收',
    text: '打地基（Slab）、框架（Frame）、封石膏板前、内装（Fixing）和交房验收（PCI），可以只验一个阶段，也可以验多个。',
    href: '/zh/quote?service=new-home',
  },
  {
    title: '业主自建房 137B 报告',
    text: '自建房出售前需要的 137B 报告，由我们的专门网站办理（英文）。',
    href: 'https://ownerbuilderinspection.melbourne',
    external: true,
  },
]

const points = [
  ['注册验房师', `维州注册验房师（Building Inspector, Limited）现场检查，注册号 ${INSPECTOR_REGISTRATION}。`],
  ['独立', '我们为买家或业主工作，不替卖方、中介或建筑商说话。'],
  ['带照片的书面报告', '电子版报告，每个发现都配照片，写清楚位置和建议的下一步。'],
  ['可加中文报告', '付款时可以选择完整的简体中文报告，照片和平面图与英文版相同。'],
] as const

const faqs = [
  {
    question: '验房能发现房子所有的问题吗？',
    answer:
      '不能。验房是目视、非破坏性的检查，只检查当天能安全到达的地方。墙体内部、地下、被家具或杂物挡住的位置看不到。报告会写明哪些地方没有检查，方便您决定是否需要进一步检查。',
  },
  {
    question: '可以出中文报告吗？',
    answer:
      '可以。下单付款时可以选择完整的简体中文报告，照片和平面图与英文报告相同，和英文报告一起发给您。英文报告是正式版本。',
  },
  {
    question: '卖方已经有验房报告了，我还需要自己验吗？',
    answer:
      '卖方报告是卖方委托的，检查范围和写给谁都由卖方决定。买房前，建议您自己委托独立的验房师，报告写给您本人，有问题也可以直接问验房师。',
  },
  {
    question: '新房为什么要分阶段验收？',
    answer:
      '很多问题在下一道工序之后就被盖住了，比如框架和封板前的问题，交房时已经看不到。在关键阶段检查，问题可以趁早让建筑商处理。',
  },
  {
    question: '怎么预约？',
    answer:
      '在网上填写中文报价表。符合网上报价条件的，提交后可以直接看到价格并付款；其他情况我们核对后用邮件发给您价格。付款后，再告诉我们谁负责开门。',
  },
]

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/zh#webpage`,
      url: `${SITE_URL}/zh`,
      name: '归处 Home Audit｜墨尔本验房',
      inLanguage: 'zh-Hans',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'Service',
      name: '墨尔本验房：买房前房屋及白蚁检查、新房分阶段验收',
      serviceType: 'Building and pest inspections; new home stage inspections',
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: { '@type': 'City', name: 'Melbourne' },
      availableLanguage: ['en', 'zh-Hans'],
      url: `${SITE_URL}/zh`,
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/zh#faq`,
      inLanguage: 'zh-Hans',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
}

export default function ChineseHomePage() {
  return (
    <main id="main-content" className="zh-page" lang="zh-Hans">
      <JsonLd data={structuredData} />

      <section className="zh-hero" aria-labelledby="zh-hero-title">
        <div className="zh-hero-photo">
          <Image
            src="/zh-hero-home.webp"
            alt="阳光下一栋整洁的独立屋，木门前是通往家门的小路"
            fill
            priority
            sizes="(max-width: 1240px) 100vw, 1240px"
          />
        </div>
        <h1 id="zh-hero-title">
          <span className="zh-hero-kicker">{ZH_BRAND_NAME} Home Audit · 墨尔本验房</span>
          历经远行，终有归处。
        </h1>
        <div className="zh-divider" aria-hidden="true" />
        <p className="zh-hero-subtitle">先看清房子，再安心向前。</p>
        <p className="zh-hero-lead">
          买房前房屋及白蚁检查、新房分阶段验收。注册验房师现场检查，报告带照片，可加中文报告。
        </p>
        <div className="zh-hero-actions">
          <Link className="button" href="/zh/quote">
            从这里开始 <span aria-hidden="true">→</span>
          </Link>
          <a className="text-link" href={CONTACT_PHONE_HREF}>
            致电 {CONTACT_PHONE}
          </a>
        </div>
      </section>

      <section className="zh-section" id="services" aria-labelledby="zh-services-title">
        <div className="zh-intro">
          <p className="zh-eyebrow">服务项目</p>
          <h2 id="zh-services-title">每一个关于家的决定，都值得看清楚。</h2>
          <p>二手房、新房、自建房，在做决定之前，先请独立的验房师看一看。</p>
        </div>
        <div className="zh-service-list">
          {services.map((service, index) => {
            const content = (
              <>
                <span className="zh-service-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="zh-service-text">
                  <strong>{service.title}</strong>
                  <small>{service.text}</small>
                </span>
                <span className="zh-service-arrow" aria-hidden="true">
                  {service.external ? '↗' : '→'}
                </span>
              </>
            )
            return service.external ? (
              <a className="zh-service-row" href={service.href} key={service.title}>
                {content}
              </a>
            ) : (
              <Link className="zh-service-row" href={service.href} key={service.title}>
                {content}
              </Link>
            )
          })}
        </div>
      </section>

      <section className="zh-section" aria-labelledby="zh-points-title">
        <div className="zh-intro">
          <p className="zh-eyebrow">您会得到什么</p>
          <h2 id="zh-points-title">独立、清楚、有照片为证。</h2>
        </div>
        <div className="zh-points">
          {points.map(([title, text]) => (
            <div key={title}>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <p className="zh-note">
          注册信息可以在{' '}
          <Link className="text-link" href="/credentials">
            资质与保险（英文）
          </Link>{' '}
          页面查看。
        </p>
      </section>

      <section className="zh-belief" id="approach" aria-labelledby="zh-approach-title">
        <div className="zh-belief-inner">
          <p className="zh-eyebrow">我们的理念</p>
          <h2 id="zh-approach-title">房子是建筑，家是长久的生活。</h2>
          <p>
            我们重视专业判断，也理解一个家对生活的分量。清楚记录看到的问题，说明哪些地方没法检查，给出实在的建议，让您更有把握地做下一步决定。
          </p>
        </div>
      </section>

      <section className="zh-section" id="faq" aria-labelledby="zh-faq-title">
        <div className="zh-intro">
          <p className="zh-eyebrow">常见问题</p>
          <h2 id="zh-faq-title">验房前，大家常问的几件事</h2>
        </div>
        <div className="faq-list zh-faqs">
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="zh-section zh-contact" id="contact" aria-labelledby="zh-contact-title">
        <p className="zh-eyebrow">联系我们</p>
        <h2 id="zh-contact-title">先看清房子，再安心向前。</h2>
        <p>告诉我们房屋地址和您需要的检查，在网上用中文填写报价表。</p>
        <div className="zh-hero-actions">
          <Link className="button" href="/zh/quote">
            获取报价 <span aria-hidden="true">→</span>
          </Link>
        </div>
        <p className="zh-contact-lines">
          电话 <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a> · 邮箱{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
        <p className="zh-note">付款页面和验房协议目前是英文，有不明白的地方欢迎来电或发邮件。</p>
      </section>
    </main>
  )
}
