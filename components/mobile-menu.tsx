'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { PRIMARY_NAV } from '@/lib/site'

// The phone menu. It closes when a link is tapped, when the page changes,
// when the visitor taps anywhere outside it, scrolls, or presses Escape, so
// it never stays open over the page content.
export function MobileMenu() {
  const ref = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

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
      <summary aria-label={open ? 'Close navigation' : 'Open navigation'}>{open ? 'Close' : 'Menu'}</summary>
      <nav aria-label="Mobile navigation">
        {PRIMARY_NAV.map((item) => (
          <Link href={item.href} key={item.href} onClick={close}>
            {item.label}
          </Link>
        ))}
        <Link className="button" href="/quote" onClick={close}>
          Get a quote
        </Link>
      </nav>
    </details>
  )
}
