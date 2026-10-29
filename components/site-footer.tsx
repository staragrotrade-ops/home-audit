'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  COMPANY_ACN,
  COMPANY_NAME,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_HREF,
  ZH_BRAND_NAME,
  ZH_TAGLINE,
  isZhPath,
} from '@/lib/site'

export function SiteFooter() {
  const zh = isZhPath(usePathname())
  if (zh) return <ChineseFooter />
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">Home Audit</div>
          <p>
            Independent building inspections for existing homes and new builds
            across Melbourne and supported Victorian locations.
          </p>
        </div>

        <div>
          <h2>Inspections</h2>
          <Link href="/building-and-pest-inspections">Building &amp; Pest</Link>
          <Link href="/new-home-inspections">New Home Inspections</Link>
          <Link href="/service-areas">Service areas</Link>
          <Link href="/guides">Buyer guides</Link>
          <a href="https://ownerbuilderinspection.melbourne">
            Owner Builder 137B
          </a>
        </div>

        <div>
          <h2>Information</h2>
          <Link href="/quote">Get a quote</Link>
          <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <Link href="/about">About Home Audit</Link>
          <Link href="/credentials">Credentials &amp; insurance</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/inspection-agreement">Inspection agreement</Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>
          {COMPANY_NAME} · ACN {COMPANY_ACN}
        </span>
        <span>
          Victoria, Australia ·{' '}
          <Link className="footer-partner-link" href="/partners/register">
            Referral partners
          </Link>
        </span>
      </div>
    </footer>
  )
}

// The footer under /zh. Most detail pages are in English, which the labels say.
function ChineseFooter() {
  return (
    <footer className="site-footer" lang="zh-Hans">
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">{ZH_BRAND_NAME} · Home Audit</div>
          <p>历经远行，终有归处。</p>
          <p>{ZH_TAGLINE}</p>
        </div>

        <div>
          <h2>业务</h2>
          <Link href="/zh/inspection">房屋检查</Link>
          <Link href="/zh/consulting">建筑技术咨询</Link>
          <a href="https://ownerbuilderinspection.melbourne">业主自建房 137B（英文网站）</a>
          <Link href="/zh/about">关于归处</Link>
          <Link href="/" hrefLang="en-AU" lang="en">
            English
          </Link>
        </div>

        <div>
          <h2>联系与资料</h2>
          <Link href="/zh/quote">获取报价</Link>
          <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <Link href="/credentials">资质与保险（英文）</Link>
          <Link href="/privacy">隐私说明（英文）</Link>
          <Link href="/inspection-agreement">验房协议（英文）</Link>
        </div>
      </div>

      <div className="container footer-bottom">
        <span lang="en">
          {COMPANY_NAME} · ACN {COMPANY_ACN}
        </span>
        <span>澳大利亚维多利亚州</span>
      </div>
    </footer>
  )
}
