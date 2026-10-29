import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { ZhContact } from '@/components/zh/zh-contact'
import { pageMetadata } from '@/lib/metadata'
import { COMPANY_ACN, COMPANY_NAME, INSPECTOR_REGISTRATION, SITE_URL } from '@/lib/site'

// 关于归处. The brand story; it lists only the services offered today.

export const metadata = pageMetadata({
  title: '关于归处 Home Audit',
  description: '归处是 Home Audit 的中文名。我们在墨尔本提供房屋检查和建筑技术咨询，从了解一栋房子开始。',
  path: '/zh/about',
  appendSiteName: false,
  locale: 'zh_CN',
})

const principles = [
  ['独立', '我们为买家和业主工作，意见不受卖方、中介或建筑商影响。'],
  ['如实', '看到什么写什么，没看到的也写清楚。不夸大问题，也不替房子说好话。'],
  ['说清楚', '报告用照片和平白的文字说明问题在哪里、为什么重要、下一步可以怎么做。'],
] as const

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      url: `${SITE_URL}/zh/about`,
      name: '关于归处 Home Audit',
      inLanguage: 'zh-Hans',
      about: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '归处', item: `${SITE_URL}/zh` },
        { '@type': 'ListItem', position: 2, name: '关于归处', item: `${SITE_URL}/zh/about` },
      ],
    },
  ],
}

export default function ChineseAboutPage() {
  return (
    <main id="main-content" className="zh-page" lang="zh-Hans">
      <JsonLd data={structuredData} />

      <section className="zh-page-hero" aria-labelledby="zh-page-title">
        <p className="zh-eyebrow">关于归处</p>
        <h1 id="zh-page-title">历经远行，终有归处。</h1>
        <p>
          归处是 Home Audit 的中文名。很多人走了很远的路，才在这里安下一个家。买房、建房、住进去以后，每一步都值得看清楚。我们从了解一栋房子开始。
        </p>
      </section>

      <section className="zh-section" aria-labelledby="zh-now-title">
        <div className="zh-intro">
          <p className="zh-eyebrow">我们现在做什么</p>
          <h2 id="zh-now-title">两项业务</h2>
        </div>
        <div className="zh-lines">
          <Link className="zh-line-card" href="/zh/inspection">
            <strong>归处 · 房屋检查</strong>
            <p>购房前验房、新房阶段检查、137B 报告、房屋状况评估。</p>
            <span className="zh-line-action">
              了解房屋检查 <span aria-hidden="true">→</span>
            </span>
          </Link>
          <Link className="zh-line-card" href="/zh/consulting">
            <strong>归处 · 建筑技术咨询</strong>
            <p>住宅建筑缺陷调查、技术评估、建筑纠纷专家报告和专家证人服务。</p>
            <span className="zh-line-action">
              了解建筑技术咨询 <span aria-hidden="true">→</span>
            </span>
          </Link>
        </div>
      </section>

      <section className="zh-section" aria-labelledby="zh-principles-title">
        <div className="zh-intro">
          <p className="zh-eyebrow">我们的做法</p>
          <h2 id="zh-principles-title">房子是建筑，家是长久的生活。</h2>
        </div>
        <div className="zh-points zh-points-3">
          {principles.map(([title, text]) => (
            <div key={title}>
              <strong>{title}</strong>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <p className="zh-note">
          <span lang="en">
            {COMPANY_NAME} · ACN {COMPANY_ACN}
          </span>
          {' · '}注册验房师 {INSPECTOR_REGISTRATION} ·{' '}
          <Link className="text-link" href="/credentials">
            资质与保险（英文）
          </Link>
        </p>
      </section>

      <ZhContact text="需要验房，可以在网上用中文填写报价表；建筑缺陷或纠纷的问题，请来电或发邮件说明情况。" />
    </main>
  )
}
