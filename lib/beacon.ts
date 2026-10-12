// src/lib/beacon.ts
// Client-side sender for /api/beacon. No cookies, no third parties; the id
// lives in sessionStorage (one per tab, gone when it closes).
export type BeaconType = "page_view" | "page_time" | "checkout_click"

function sid(): string {
  try {
    let id = sessionStorage.getItem("egoff_sid")
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem("egoff_sid", id) }
    return id
  } catch {
    return "nostore" + Math.random().toString(36).slice(2, 10)
  }
}

export function beacon(type: BeaconType, data: { item?: string; value?: number; path?: string; ref?: string } = {}) {
  if (typeof window === "undefined") return
  const path = data.path ?? window.location.pathname
  if (path.startsWith("/admin")) return
  if (window.location.hostname === "localhost") return
  const payload = JSON.stringify({ type, sid: sid(), path, ...data })
  try { if (navigator.sendBeacon?.("/api/beacon", payload)) return } catch { /* fall through */ }
  fetch("/api/beacon", { method: "POST", body: payload, keepalive: true }).catch(() => {})
}
