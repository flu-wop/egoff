// src/app/api/beacon/route.ts
// Cookieless browsing events for /admin/insights, sent with sendBeacon from
// lib/beacon.ts. Stores no IP, name or email: only an anonymous per-tab id.
// The IP is used only as an in-memory rate-limit key, never written to events.
import { NextResponse } from "next/server"
import { getDB } from "@/lib/insights/db"
import { ensureSiteEvents, safeTable } from "@/lib/insights/site-events"
import { insightsConfig as cfg } from "@/lib/insights/config"

// In-memory limiter: each serverless instance counts on its own, which is
// enough to stop a single script from flooding the events table.
const hits = new Map<string, { n: number; reset: number }>()
function allowed(ip: string): boolean {
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || h.reset < now) { hits.set(ip, { n: 1, reset: now + 60_000 }); return true }
  h.n++
  return h.n <= 240
}
function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown").split(",")[0].trim()
}

const TYPES = new Set(cfg.eventTypes)
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|embedly|monitor/i

function clean(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null
  const s = v.replace(/[\u0000-\u001f]/g, "").trim()
  return s ? s.slice(0, max) : null
}

export async function POST(req: Request) {
  const ua = req.headers.get("user-agent") ?? ""
  if (!ua || BOT.test(ua)) return new NextResponse(null, { status: 204 })

  const raw = await req.text()
  if (raw.length > 2048) return new NextResponse(null, { status: 413 })
  let body: Record<string, unknown>
  try { body = JSON.parse(raw) } catch { return new NextResponse(null, { status: 400 }) }

  const type = clean(body.type, 32)
  const sid = clean(body.sid, 40)
  const path = clean(body.path, 200)
  if (!type || !TYPES.has(type) || !sid || !/^[a-z0-9-]+$/i.test(sid)) return new NextResponse(null, { status: 400 })
  if (path && (path.startsWith("/admin") || path.startsWith("/api"))) return new NextResponse(null, { status: 204 })

  const n = Number(body.value)
  const value = Number.isFinite(n) ? Math.max(0, Math.min(n, 100000)) : null
  const device = /Mobi|Android|iPhone/i.test(ua) ? "mobile" : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop"

  try {
    if (!allowed(clientIp(req))) return new NextResponse(null, { status: 204 })
    const db = getDB()
    if (!db) return new NextResponse(null, { status: 204 })
    await ensureSiteEvents(db, cfg.eventsTable)
    await db.execute({
      sql: `INSERT INTO ${safeTable(cfg.eventsTable)} (ts, sid, type, path, item, value, ref, device) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [new Date().toISOString(), sid, type, path, clean(body.item, 200), value, clean(body.ref, 120), device],
    })
  } catch (err) {
    console.error("[beacon] insert failed:", err)
  }
  return new NextResponse(null, { status: 204 })
}
