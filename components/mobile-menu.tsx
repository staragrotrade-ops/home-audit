'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { PRIMARY_NAV, ZH_NAV, ZH_PATH, isZhPath } from '@/lib/site'

// The phone menu. It closes when a link is tapped, when the page changes,
// when the visitor taps anywhere outside it, scrolls, or presses Escape, so
// it never stays open over the page content.
export function MobileMenu() {
  const ref = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const zh = isZhPath(pathname)
  const nav: readonly { href: string; label: string }[] = zh ? ZH_NAV : PRIMARY_NAV

  function close() {
    if (ref.current) ref.current.open = false
    setOpen(false)
  }

  useEffect(() => {
    close()
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const startY = window.scrollY
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 40) close()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll)
    }
  }, [open])

  return (
    <details className="mobile-menu" ref={ref} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary aria-label={open ? (zh ? '关闭菜单' : 'Close navigation') : zh ? '打开菜单' : 'Open navigation'}>
        {open ? (zh ? '关闭' : 'Close') : zh ? '菜单' : 'Menu'}
      </summary>
      <nav aria-label={zh ? '手机导航' : 'Mobile navigation'}>
        {nav.map((item) => (
          <Link href={item.href} key={item.href} onClick={close}>
            {item.label}
          </Link>
        ))}
        <Link href={zh ? '/' : ZH_PATH} hrefLang={zh ? 'en-AU' : 'zh-Hans'} onClick={close}>
          {zh ? 'English' : '中文'}
        </Link>
        <Link className="button" href={zh ? '/zh/quote' : '/quote'} onClick={close}>
          {zh ? '获取报价' : 'Get a quote'}
        </Link>
      </nav>
    </details>
  )
}
