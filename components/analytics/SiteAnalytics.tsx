"use client"
// Records a page_view on each route change and the visible seconds on the
// page when the visitor leaves it. Feeds /admin/insights. Renders nothing.
import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { beacon } from "@/lib/beacon"

function externalRef(): string | undefined {
  try {
    if (!document.referrer) return undefined
    const host = new URL(document.referrer).hostname.replace(/^www\./, "")
    return host && host !== window.location.hostname.replace(/^www\./, "") ? host : undefined
  } catch { return undefined }
}

export function SiteAnalytics() {
  const pathname = usePathname()
  const first = useRef(true)
  const visibleMs = useRef(0)
  const shownAt = useRef<number | null>(null)
  const current = useRef<string | null>(null)

  useEffect(() => {
    const flush = () => {
      if (shownAt.current !== null) { visibleMs.current += Date.now() - shownAt.current; shownAt.current = null }
      const secs = Math.round(visibleMs.current / 1000)
      if (current.current && secs >= 1) beacon("page_time", { path: current.current, value: Math.min(secs, 1800) })
      visibleMs.current = 0
    }
    if (!pathname || pathname.startsWith("/admin")) { current.current = null; return }
    current.current = pathname
    visibleMs.current = 0
    shownAt.current = document.visibilityState === "visible" ? Date.now() : null
    beacon("page_view", { path: pathname, ref: first.current ? externalRef() : undefined })
    first.current = false
    const onVis = () => { if (document.visibilityState === "hidden") flush(); else shownAt.current = Date.now() }
    document.addEventListener("visibilitychange", onVis)
    window.addEventListener("pagehide", flush)
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("pagehide", flush); flush() }
  }, [pathname])

  return null
}
