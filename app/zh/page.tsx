import Image from 'next/image'
import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { ZhContact } from '@/components/zh/zh-contact'
import { pageMetadata } from '@/lib/metadata'
import { CONTACT_PHONE, HOME_LANGUAGES, INSPECTOR_REGISTRATION, SITE_URL, ZH_BRAND_NAME } from '@/lib/site'

// 归处 — the Chinese brand home page. 归处 is the company's Chinese name; the
// site shows the two business lines that are offered today: 房屋检查 and
// 建筑技术咨询 (owner decision, 30 October 2026). No prices on the Chinese
// pages (owner decision, 29 October 2026).

export const metadata = pageMetadata({
  title: '归处 Home Audit｜墨尔本验房与建筑技术咨询',
  description:
    '归处 Home Audit：墨尔本房屋检查与建筑技术咨询。买房前验房、白蚁检查、新房分阶段验收、房屋状况评估，以及住宅建筑缺陷调查和纠纷专家报告。',
  path: '/zh',
  appendSiteName: false,
  locale: 'zh_CN',
  languages: HOME_LANGUAGES,
})

const lines = [
  {
    name: '归处 · 房屋检查',
    text: '购房前验房、新房阶段检查、137B 报告、房屋状况评估。买房、建房、自住或出租前，先看清房子的状况。',
    href: '/zh/inspection',
    action: '了解房屋检查',
  },
  {
    name: '归处 · 建筑技术咨询',
    text: '住宅建筑缺陷调查、技术评估、建筑纠纷专家报告，以及按规定提供的专家证人服务。',
    href: '/zh/consulting',
    action: '了解建筑技术咨询',
  },
]

const points = [
  ['注册验房师', `维州注册验房师亲自检查和撰写报告，注册号 ${INSPECTOR_REGISTRATION}。`],
  ['独立', '我们为买家和业主工作，不替卖方、中介或建筑商说话。'],
  ['有照片为证', '每个发现都配照片，写清楚位置、看到了什么、建议下一步怎么做。'],
  ['可加中文报告', '验房报告可以加购完整的简体中文版，照片和平面图与英文版相同。'],
] as const

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/zh#webpage`,
      url: `${SITE_URL}/zh`,
      name: '归处 Home Audit',
      inLanguage: 'zh-Hans',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      about: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      alternateName: '归处',
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
          <span className="zh-hero-kicker">{ZH_BRAND_NAME} Home Audit</span>
          历经远行，终有归处。
        </h1>
        <div className="zh-divider" aria-hidden="true" />
        <p className="zh-hero-subtitle">从了解一栋房子开始。</p>
        <p className="zh-hero-lead">墨尔本房屋检查与建筑技术咨询。注册验房师亲自检查，报告带照片，可加中文报告。</p>
        <div className="zh-hero-actions">
          <Link className="button" href="/zh/inspection">
            房屋检查 <span aria-hidden="true">→</span>
          </Link>
          <Link className="button button-secondary" href="/zh/consulting">
            建筑技术咨询 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="zh-section" id="services" aria-labelledby="zh-lines-title">
        <div className="zh-intro">
          <p className="zh-eyebrow">我们的业务</p>
          <h2 id="zh-lines-title">每一个关于家的决定，都值得看清楚。</h2>
        </div>
        <div className="zh-lines">
          {lines.map((line) => (
            <Link className="zh-line-card" href={line.href} key={line.href}>
              <strong>{line.name}</strong>
              <p>{line.text}</p>
              <span className="zh-line-action">
                {line.action} <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="zh-section" aria-labelledby="zh-points-title">
        <div className="zh-intro">
          <p className="zh-eyebrow">为什么选择归处</p>
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
      </section>

      <section className="zh-belief" id="approach" aria-labelledby="zh-approach-title">
        <div className="zh-belief-inner">
          <p className="zh-eyebrow">我们的理念</p>
          <h2 id="zh-approach-title">房子是建筑，家是长久的生活。</h2>
          <p>
            我们重视专业判断，也理解一个家对生活的分量。清楚记录看到的问题，说明哪些地方没法检查，给出实在的建议，让您更有把握地做下一步决定。
          </p>
          <p>
            <Link className="text-link" href="/zh/about">
              关于归处 <span aria-hidden="true">→</span>
            </Link>
          </p>
        </div>
      </section>

      <ZhContact
        text={`需要验房，可以在网上用中文填写报价表；建筑缺陷或纠纷的问题，请致电 ${CONTACT_PHONE} 或发邮件说明情况。`}
      />
    </main>
  )
}
