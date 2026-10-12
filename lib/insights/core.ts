// src/lib/insights/core.ts
// getInsights(db, cfg, days): server-only aggregation behind /admin/insights.
// Browsing comes from the site's events table (/api/beacon); sales and other
// numbers come from the config's sources. Days are bucketed in cfg.timezone.
import "server-only"
import type { Client } from "@libsql/client"
import { ensureSiteEvents, safeTable } from "./site-events"
import type { DayRange, Insights, InsightsConfig } from "./types"

const DAY_MS = 86_400_000

export function localDay(d: Date, tz: string): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d)
}

export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`)
  return new Date(d.getTime() + n * DAY_MS).toISOString().slice(0, 10)
}

function dayList(r: DayRange): string[] {
  const out: string[] = []
  for (let d = r.start; d <= r.end; d = addDays(d, 1)) out.push(d)
  return out
}

export function clampDays(n: number): number {
  return Math.max(7, Math.min(365, Math.round(n) || 30))
}

export async function getInsights(db: Client, cfg: InsightsConfig, daysIn = 30): Promise<Insights> {
  const days = clampDays(daysIn)
  const table = safeTable(cfg.eventsTable)
  await ensureSiteEvents(db, table)

  const today = localDay(new Date(), cfg.timezone)
  const cur: DayRange = { start: addDays(today, -(days - 1)), end: today }
  const prev: DayRange = { start: addDays(cur.start, -days), end: addDays(cur.start, -1) }
  const inRange = (d: string, r: DayRange) => d >= r.start && d <= r.end

  const [evRes, firstRes] = await Promise.all([
    db.execute({
      sql: `SELECT ts, sid, type, path, value, ref, device FROM ${table} WHERE ts >= ? ORDER BY ts`,
      args: [`${addDays(prev.start, -1)}T00:00:00Z`],
    }),
    db.execute(`SELECT MIN(ts) AS first FROM ${table}`),
  ])

  const visitorsDay = new Map<string, Set<string>>()
  const visitorsCur = new Set<string>()
  const visitorsPrev = new Set<string>()
  let viewsCur = 0, viewsPrev = 0
  const pages = new Map<string, { views: number; secs: number; timed: number }>()
  const refs = new Map<string, Set<string>>()
  const devices: Record<string, Set<string>> = {}
  const funnelSets = (cfg.funnels ?? []).map((f) => f.steps.map(() => new Set<string>()))

  for (const e of evRes.rows) {
    const day = localDay(new Date(String(e.ts)), cfg.timezone)
    const sid = String(e.sid)
    const type = String(e.type)
    const path = e.path ? String(e.path) : ""
    const isCur = inRange(day, cur)
    const isPrev = inRange(day, prev)

    if (type === "page_view") {
      if (isCur) {
        viewsCur++
        visitorsCur.add(sid)
        if (!visitorsDay.has(day)) visitorsDay.set(day, new Set())
        visitorsDay.get(day)!.add(sid)
        const p = pages.get(path) ?? { views: 0, secs: 0, timed: 0 }
        p.views++
        pages.set(path, p)
        if (e.ref) { const h = String(e.ref); if (!refs.has(h)) refs.set(h, new Set()); refs.get(h)!.add(sid) }
        const dev = e.device ? String(e.device) : "desktop"
        if (!devices[dev]) devices[dev] = new Set()
        devices[dev].add(sid)
      } else if (isPrev) { viewsPrev++; visitorsPrev.add(sid) }
    }
    if (isCur && type === "page_time") {
      const p = pages.get(path) ?? { views: 0, secs: 0, timed: 0 }
      p.secs += Number(e.value) || 0
      p.timed++
      pages.set(path, p)
    }
    if (isCur) {
      (cfg.funnels ?? []).forEach((f, fi) =>
        f.steps.forEach((s, si) => {
          if (s.type === type && (!s.path || s.path === path)) funnelSets[fi][si].add(sid)
        }),
      )
    }
  }

  // Sources (sales etc.), current + previous window. A failing source shows 0
  // rather than taking the whole page down.
  const srcRows = await Promise.all(
    cfg.sources.map(async (s) => {
      const safe = (r: DayRange) => s.fetch(r, db).catch((err) => { console.error(`[insights:${s.key}]`, err); return [] })
      const [c, p] = await Promise.all([safe(cur), safe(prev)])
      return { s, c, p }
    }),
  )

  const sourceDay = new Map<string, Map<string, number>>()
  const sources = srcRows.map(({ s, c, p }) => {
    const m = new Map<string, number>()
    for (const r of c) if (inRange(r.date, cur)) m.set(r.date, (m.get(r.date) ?? 0) + r.value)
    sourceDay.set(s.key, m)
    const total = [...m.values()].reduce((a, b) => a + b, 0)
    const prevTotal = p.filter((r) => inRange(r.date, prev)).reduce((a, r) => a + r.value, 0)
    return { key: s.key, label: s.label, format: s.format, total, prev: prevTotal }
  })

  const daily = dayList(cur).map((date) => ({
    date,
    visitors: visitorsDay.get(date)?.size ?? 0,
    series: Object.fromEntries(cfg.sources.map((s) => [s.key, sourceDay.get(s.key)?.get(date) ?? 0])),
  }))

  const attention = cfg.attention ? await cfg.attention(db).catch(() => []) : []

  return {
    range: { days, start: cur.start, end: cur.end },
    trackingSince: firstRes.rows[0]?.first ? String(firstRes.rows[0].first) : null,
    visitors: { cur: visitorsCur.size, prev: visitorsPrev.size },
    pageviews: { cur: viewsCur, prev: viewsPrev },
    sources,
    daily,
    pages: [...pages.entries()]
      .map(([path, p]) => ({ path, views: p.views, avgTime: p.timed ? Math.round(p.secs / p.timed) : 0 }))
      .filter((p) => p.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 15),
    referrers: [...refs.entries()].map(([host, s]) => ({ host, visits: s.size })).sort((a, b) => b.visits - a.visits).slice(0, 10),
    devices: Object.fromEntries(Object.entries(devices).map(([k, v]) => [k, v.size])),
    funnels: (cfg.funnels ?? []).map((f, fi) => ({
      label: f.label,
      steps: f.steps.map((s, si) => ({ label: s.label, value: funnelSets[fi][si].size })),
    })),
    attention,
  }
}
