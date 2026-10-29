import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { ZhContact } from '@/components/zh/zh-contact'
import { pageMetadata } from '@/lib/metadata'
import { CONTACT_EMAIL, INSPECTOR_REGISTRATION, SITE_URL } from '@/lib/site'

// 归处 · 房屋检查. No prices on the Chinese pages (owner decision).

export const metadata = pageMetadata({
  title: '墨尔本验房｜买房前房屋及白蚁检查、新房阶段检查、房屋状况评估｜归处',
  description:
    '归处 · 房屋检查：墨尔本买房前验房（房屋 + 白蚁）、拍卖前验房、新房打地基到交房（PCI）各阶段检查、137B 报告和房屋状况评估。注册验房师亲自检查，报告带照片，可加中文报告。',
  path: '/zh/inspection',
  appendSiteName: false,
  locale: 'zh_CN',
})

const conditionEmail = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('房屋状况评估')}`

const services = [
  {
    title: '购房前验房（房屋 + 白蚁）',
    text: '买二手房前，看清房屋的可见缺陷、潮湿迹象和白蚁风险，也写明哪些地方当天没法检查。',
    href: '/zh/quote?service=building-and-pest',
  },
  {
    title: '拍卖前验房',
    text: '拍卖买房没有冷静期。提交报价时写上拍卖日期，我们会尽量在拍卖前安排。',
    href: '/zh/quote?service=building-and-pest',
  },
  {
    title: '新房阶段检查',
    text: '打地基（Slab）、框架（Frame）、封石膏板前、内装（Fixing）和交房验收（PCI），可以只验一个阶段，也可以验多个。',
    href: '/zh/quote?service=new-home',
  },
  {
    title: '业主自建房 137B 报告',
    text: '自建房在建成后 6.5 年内出售，需要 137B 报告。由我们的专门网站办理（英文）。',
    href: 'https://ownerbuilderinspection.melbourne',
    external: true,
  },
  {
    title: '房屋状况评估',
    text: '不买房也可以做：自住房屋的现状检查，或出租、邻居施工前后的房屋状况记录（Dilapidation report）。请来电或发邮件说明用途。',
    href: conditionEmail,
    external: true,
  },
]

const faqs = [
  {
    question: '验房验的是什么？',
    answer:
      '按照澳洲验房标准进行：买房前房屋检查依据 AS 4349.1，白蚁检查依据 AS 4349.3。验房师目视检查当天能安全到达的部位，包括室内、室外、屋顶空间和地板下（能进入的话）以及场地，记录重大缺陷、一般缺陷和安全隐患，并写明哪些地方没能检查。新房阶段检查则对照该阶段应完成的施工内容。',
  },
  {
    question: '墙上有裂缝，是不是地基下沉？',
    answer:
      '不一定。判断地基问题，关键是看裂缝的形态、位置和分布，以及有没有其他沉降迹象，比如门窗变形关不严、地面倾斜。不能单凭一条裂缝就认定地基有问题。需要时，我们会建议请结构工程师进一步评估。',
  },
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
      '卖方报告是卖方委托的，检查范围和检查深度都由卖方决定。买房前，建议您自己委托独立的验房师，报告写给您本人，有问题也可以直接问验房师。',
  },
  {
    question: '新房为什么要分阶段检查？',
    answer:
      '很多问题在下一道工序之后就被盖住了，比如框架和封板前的问题，交房时已经看不到。在关键阶段检查，问题可以趁早让建筑商处理。',
  },
  {
    question: '房屋状况记录（Dilapidation report）有什么用？',
    answer:
      '在出租、装修或邻居施工之前，把房屋当时的状况用文字和照片记录下来。以后如果出现新的损坏，可以和当时的记录对比。',
  },
  {
    question: '怎么预约？',
    answer:
      '验房请在网上填写中文报价表。符合网上报价条件的，提交后可以直接看到价格并付款；其他情况我们核对后用邮件发给您价格。房屋状况评估请来电或发邮件说明用途。',
  },
]

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '归处', item: `${SITE_URL}/zh` },
        { '@type': 'ListItem', position: 2, name: '房屋检查', item: `${SITE_URL}/zh/inspection` },
      ],
    },
    {
      '@type': 'Service',
      name: '归处 · 房屋检查',
      serviceType: 'Pre-purchase building and pest inspections; new home stage inspections; property condition reports',
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: { '@type': 'City', name: 'Melbourne' },
      availableLanguage: ['en', 'zh-Hans'],
      url: `${SITE_URL}/zh/inspection`,
    },
    {
      '@type': 'FAQPage',
      inLanguage: 'zh-Hans',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
  ],
}

export default function ChineseInspectionPage() {
  return (
    <main id="main-content" className="zh-page" lang="zh-Hans">
      <JsonLd data={structuredData} />

      <section className="zh-page-hero" aria-labelledby="zh-page-title">
        <p className="zh-eyebrow">归处 · 房屋检查</p>
        <h1 id="zh-page-title">墨尔本验房：买房、建房前，先看清房子。</h1>
        <p>
          注册验房师（{INSPECTOR_REGISTRATION}）亲自到现场检查，报告带照片，写清楚看到了什么、哪些地方没法检查、建议下一步怎么做。可加购完整中文报告。
        </p>
        <div className="zh-hero-actions">
          <Link className="button" href="/zh/quote">
            获取验房报价 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="zh-section" id="services" aria-labelledby="zh-services-title">
        <div className="zh-intro">
          <p className="zh-eyebrow">服务项目</p>
          <h2 id="zh-services-title">选择您需要的检查</h2>
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
        <p className="zh-note">
          注册信息可以在{' '}
          <Link className="text-link" href="/credentials">
            资质与保险（英文）
          </Link>{' '}
          页面查看。
        </p>
      </section>

      <ZhContact text="告诉我们房屋地址和您需要的检查，在网上用中文填写报价表。" />
    </main>
  )
}
