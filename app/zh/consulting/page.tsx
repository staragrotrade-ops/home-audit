import { JsonLd } from '@/components/json-ld'
import { ZhContact } from '@/components/zh/zh-contact'
import { pageMetadata } from '@/lib/metadata'
import { INSPECTOR_REGISTRATION, INSPECTOR_REGISTRATION_CLASS, SITE_URL } from '@/lib/site'

// 归处 · 建筑技术咨询. Done by the same registered inspector, so the scope is
// residential buildings (Class 1 and 10) within that registration; anything
// outside it is referred on. Expert evidence is the expert's own opinion, owed
// to the tribunal or court — no promise of an outcome. The page says
// "assessment", never a word that implies official certification. Chinese
// only (owner decision, 30 October 2026).

export const metadata = pageMetadata({
  title: '墨尔本建筑缺陷调查与建筑纠纷专家报告｜归处 · 建筑技术咨询',
  description:
    '归处 · 建筑技术咨询：墨尔本住宅建筑缺陷调查、技术评估、建筑纠纷专家报告，以及按 VCAT 和法院专家证据规定提供的专家证人服务。由注册验房师负责，先看资料、确认范围再报价。',
  path: '/zh/consulting',
  appendSiteName: false,
  locale: 'zh_CN',
})

const services = [
  {
    title: '建筑缺陷调查',
    text: '漏水、开裂、潮湿、地面或墙体变形等问题，到现场查看，记录缺陷的位置、范围和可能的原因，写成带照片的报告。',
  },
  {
    title: '技术评估',
    text: '对照建筑合同、图纸、施工规范和行业做法，评估工程是否存在缺陷或未完成的项目，说明需要怎样处理。',
  },
  {
    title: '建筑纠纷专家报告',
    text: '和建筑商、卖方或邻居有争议时，为协商、DBDRV（维州住宅建筑纠纷解决机构）、VCAT 或法院准备独立的专家报告。',
  },
  {
    title: '专家证人',
    text: '需要时，按照 VCAT 和法院对专家证据的规定，出具专家报告并出庭说明意见。',
  },
]

const steps = [
  ['说明情况', '来电或发邮件，简单说明房屋、问题和目前进展，有合同、照片、往来邮件可以一起发来。'],
  ['确认范围和费用', '我们看过资料后，告诉您能不能做、需要做哪些工作和费用，您同意后再开始。'],
  ['现场调查', '到现场查看和记录。需要打开或拆除的部分，要先取得业主同意。'],
  ['书面报告', '按约定的范围出具书面报告。用于 VCAT 或法院的报告按其专家证据规定撰写，正式报告为英文。'],
] as const

const faqs = [
  {
    question: '专家报告会站在我这一边吗？',
    answer:
      '专家的意见必须独立、客观。按照 VCAT 和法院的规定，专家首先对审理机构负责，而不是对委托人负责。报告会如实写出我们的专业意见，包括对您不利的部分。这样的报告在协商和审理中才有分量。',
  },
  {
    question: '你们能处理哪些建筑？',
    answer: `由注册验房师（${INSPECTOR_REGISTRATION_CLASS}，${INSPECTOR_REGISTRATION}）负责，范围是住宅建筑（独立屋、联排别墅等 Class 1 建筑及车库、围栏等 Class 10 附属建筑）。商业建筑、结构计算或需要结构工程师、律师判断的问题，我们会说明并建议您找合适的专业人士。`,
  },
  {
    question: '我需要专家报告吗？',
    answer:
      '这要看纠纷进行到哪一步。很多问题先用一份清楚的缺陷报告就能和建筑商协商解决。是否需要正式的专家证据、在哪个机构处理，请咨询您的律师或 DBDRV。',
  },
  {
    question: '费用怎么算？',
    answer: '每个案子的范围不一样。我们先看您发来的资料，确认需要做的工作后再报价，您同意后才开始。',
  },
  {
    question: '报告是中文还是英文？',
    answer: '正式报告为英文，以便提交给建筑商、律师或审理机构。',
  },
]

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '归处', item: `${SITE_URL}/zh` },
        { '@type': 'ListItem', position: 2, name: '建筑技术咨询', item: `${SITE_URL}/zh/consulting` },
      ],
    },
    {
      '@type': 'Service',
      name: '归处 · 建筑技术咨询',
      serviceType: 'Residential building defect investigation and expert reports',
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: { '@type': 'AdministrativeArea', name: 'Victoria' },
      availableLanguage: ['en', 'zh-Hans'],
      url: `${SITE_URL}/zh/consulting`,
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

export default function ChineseConsultingPage() {
  return (
    <main id="main-content" className="zh-page" lang="zh-Hans">
      <JsonLd data={structuredData} />

      <section className="zh-page-hero" aria-labelledby="zh-page-title">
        <p className="zh-eyebrow">归处 · 建筑技术咨询</p>
        <h1 id="zh-page-title">房子出了问题，先把事实查清楚。</h1>
        <p>
          住宅建筑缺陷调查、技术评估和建筑纠纷专家报告。由注册验房师负责，独立、客观，用照片和事实说话。
        </p>
      </section>

      <section className="zh-section" id="services" aria-labelledby="zh-services-title">
        <div className="zh-intro">
          <p className="zh-eyebrow">服务内容</p>
          <h2 id="zh-services-title">我们可以帮您做什么</h2>
        </div>
        <div className="zh-points zh-points-2">
          {services.map((service) => (
            <div key={service.title}>
              <strong>{service.title}</strong>
              <p>{service.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="zh-section" aria-labelledby="zh-steps-title">
        <div className="zh-intro">
          <p className="zh-eyebrow">怎么开始</p>
          <h2 id="zh-steps-title">先看资料，再确认范围和费用</h2>
        </div>
        <ol className="zh-steps">
          {steps.map(([title, text]) => (
            <li key={title}>
              <strong>{title}</strong>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="zh-section" id="faq" aria-labelledby="zh-faq-title">
        <div className="zh-intro">
          <p className="zh-eyebrow">常见问题</p>
          <h2 id="zh-faq-title">委托之前，您可能想知道</h2>
        </div>
        <div className="faq-list zh-faqs">
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
        <p className="zh-note">我们不提供法律意见。涉及合同权利、索赔和诉讼程序的问题，请咨询律师。</p>
      </section>

      <ZhContact
        title="说明情况，我们看过资料再回复您。"
        text="请简单写明房屋地址、遇到的问题和目前进展；合同、照片和往来邮件可以作为附件发来。"
        quote={false}
        emailSubject="建筑技术咨询"
        note=""
      />
    </main>
  )
}
