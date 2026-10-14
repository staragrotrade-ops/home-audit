'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
  captureReferral,
  getVisit,
  isExcludedPath,
  newId,
  recordPageActivity,
  trackVisitorEvent,
} from '@/lib/visitor-analytics'

const HEARTBEAT_MS = 15_000

// Counts page views and the time a page is actually in front of the visitor
// (visible and focused). Mounted once in the root layout.
export function VisitorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const link = (event.target as Element | null)?.closest?.('a[href]')
      const href = link?.getAttribute('href') || ''
      if (href.startsWith('tel:')) trackVisitorEvent('phone_clicked', { eventKey: window.location.pathname })
      else if (href.startsWith('mailto:')) trackVisitorEvent('email_clicked', { eventKey: window.location.pathname })
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => {
    // Before anything else, so a ?ref= link is saved even on excluded pages.
    captureReferral()
    if (!pathname || isExcludedPath(pathname) || !getVisit()) return

    const pageInstanceId = newId()
    let ended = false
    let attentive = document.visibilityState === 'visible' && document.hasFocus()
    let activeSince: number | null = attentive ? Date.now() : null

    function takeSeconds() {
      if (activeSince === null) return 0
      const now = Date.now()
      const seconds = Math.max(0, Math.min(60, Math.round((now - activeSince) / 1000)))
      activeSince = now
      return seconds
    }

    trackVisitorEvent('page_view', { eventKey: pageInstanceId, path: pathname })
    recordPageActivity({ action: 'start', pageInstanceId, path: pathname })

    const timer = window.setInterval(() => {
      if (ended || activeSince === null) return
      const activeSeconds = takeSeconds()
      if (activeSeconds > 0) {
        recordPageActivity({ action: 'heartbeat', pageInstanceId, path: pathname, activeSeconds })
      }
    }, HEARTBEAT_MS)

    function syncAttention() {
      if (ended) return
      const next = document.visibilityState === 'visible' && document.hasFocus()
      if (next === attentive) return
      attentive = next
      if (next) {
        activeSince = Date.now()
        return
      }
      const activeSeconds = takeSeconds()
      activeSince = null
      if (activeSeconds > 0) {
        recordPageActivity({ action: 'visibility', pageInstanceId, path: pathname, activeSeconds }, true)
      }
    }

    function finish(exitReason: string) {
      if (ended) return
      const activeSeconds = takeSeconds()
      ended = true
      recordPageActivity(
        { action: 'exit', pageInstanceId, path: pathname, activeSeconds, exitReason },
        true,
      )
    }

    const onPageHide = () => finish('pagehide')
    document.addEventListener('visibilitychange', syncAttention)
    window.addEventListener('focus', syncAttention)
    window.addEventListener('blur', syncAttention)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', syncAttention)
      window.removeEventListener('focus', syncAttention)
      window.removeEventListener('blur', syncAttention)
      window.removeEventListener('pagehide', onPageHide)
      finish('route_change')
    }
  }, [pathname])

  return null
}
