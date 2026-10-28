'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MobileMenu } from '@/components/mobile-menu'
import { CONTACT_PHONE, CONTACT_PHONE_HREF, PRIMARY_NAV, ZH_BRAND_NAME, ZH_NAV, ZH_PATH, isZhPath } from '@/lib/site'

// The same header in English and, under /zh, in Chinese.
export function SiteHeader() {
  const zh = isZhPath(usePathname())
  const nav: readonly { href: string; label: string }[] = zh ? ZH_NAV : PRIMARY_NAV

  return (
    <header className="site-header" lang={zh ? 'zh-Hans' : undefined}>
      <div className="container header-inner">
        <Link className="brand" href={zh ? ZH_PATH : '/'} aria-label={zh ? '归处 Home Audit 首页' : 'Home Audit home'}>
          <span className="brand-mark" aria-hidden="true">
            HA
          </span>
          <span className="brand-copy">
            <strong>Home Audit</strong>
            <small>{zh ? `${ZH_BRAND_NAME} · 验房 · 白蚁 · 新房` : 'Building · Pest · New Homes'}</small>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label={zh ? '主导航' : 'Primary navigation'}>
          {nav.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <Link className="header-language" href={zh ? '/' : ZH_PATH} hrefLang={zh ? 'en-AU' : 'zh-Hans'} lang={zh ? 'en' : 'zh-Hans'}>
            {zh ? 'English' : '中文'}
          </Link>
          <a className="header-phone" href={CONTACT_PHONE_HREF} aria-label={`${zh ? '致电' : 'Call'} ${CONTACT_PHONE}`}>
            <span className="header-phone-full">{CONTACT_PHONE}</span>
            <span className="header-phone-short" aria-hidden="true">
              {zh ? '致电' : 'Call'}
            </span>
          </a>
          <Link className="button button-small header-cta" href={zh ? '/zh/quote' : '/quote'}>
            {zh ? '获取报价' : 'Get a quote'}
          </Link>
        </div>

        <MobileMenu />
      </div>
    </header>
  )
}
