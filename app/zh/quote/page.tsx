import { QuoteFlow } from '@/components/quote-flow'
import { pageMetadata } from '@/lib/metadata'
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/lib/site'
import { normalizeVoucherCode } from '@/lib/voucher-rules'

// The quote form in Chinese. It is the same form as /quote: the answers are
// sent to the same place, and the job notes that it was filled in Chinese.
export const metadata = pageMetadata({
  title: '获取验房报价｜归处 Home Audit',
  description: '用中文填写验房报价表：买房前房屋及白蚁检查、新房分阶段验收。',
  path: '/zh/quote',
  index: false,
  appendSiteName: false,
  locale: 'zh_CN',
})

type QuotePageProps = {
  searchParams: Promise<{ service?: string; voucher?: string }>
}

export default async function ChineseQuotePage({ searchParams }: QuotePageProps) {
  const { service, voucher } = await searchParams
  const initialVoucherCode = normalizeVoucherCode(voucher)
  const initialService =
    service === 'new-home'
      ? ('new_home' as const)
      : service === 'building-and-pest'
        ? ('existing_home' as const)
        : ('' as const)

  return (
    <main id="main-content" className="quote-page zh-page" lang="zh-Hans">
      <div className="container">
        <div className="quote-heading">
          <p className="eyebrow">验房报价</p>
          <h1>验房，您买的不是一件商品，而是专业知识和保障。</h1>
          <p>验房是一门科学，科学都有严谨的流程。请按流程回答以下问题，我们需要足够的信息，才能把工作做好。</p>
          <p className="quote-contact">
            想直接沟通？请致电 <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a>，或发邮件到{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>。
          </p>
          <p className="quote-contact">提交后的付款页面和验房协议目前是英文。</p>
        </div>
        <QuoteFlow
          lang="zh"
          initialService={initialService}
          initialInspectionType={service === 'building-and-pest' ? 'building_and_pest' : ''}
          submissionEnabled={process.env.QUOTE_SUBMISSION_ENABLED === 'true'}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
          initialVoucherCode={initialVoucherCode}
        />
      </div>
    </main>
  )
}
