// src/lib/insights/types.ts
// Config + result types for the shared Insights core. Each site supplies an
// InsightsConfig; getInsights(db, cfg, days) does the rest. Privacy: events
// hold an anonymous per-tab id only. No IPs, emails or names are stored.
import type { Client } from "@libsql/client"

export type DayRange = { start: string; end: string }   // local YYYY-MM-DD, inclusive
export type DayValue = { date: string; value: number }  // value in dollars for money, count otherwise

export interface InsightsSource {
  key: string
  label: string
  format: "money" | "count"
  /** Returns one row per event (or per day); the core sums rows by date. */
  fetch: (range: DayRange, db: Client) => Promise<DayValue[]>
}

export interface FunnelStep {
  label: string
  /** Counts distinct visitors (sessions) that sent this event type. */
  type: string
  /** Optional: only events on this exact path. */
  path?: string
}

export interface InsightsConfig {
  siteName: string
  /** Events table for this site. MUST be unique when sites share one database. */
  eventsTable: string
  timezone: string
  /** Event types the beacon route accepts, e.g. ["page_view", "page_time", "checkout_click"]. */
  eventTypes: string[]
  sources: InsightsSource[]
  funnels?: { label: string; steps: FunnelStep[] }[]
  /** Optional "needs attention" items, shown at the top of Overview. */
  attention?: (db: Client) => Promise<{ label: string; value: number; tone?: "alert" | "ok" }[]>
}

export interface Insights {
  range: { days: number; start: string; end: string }
  trackingSince: string | null
  visitors: { cur: number; prev: number }
  pageviews: { cur: number; prev: number }
  sources: { key: string; label: string; format: "money" | "count"; total: number; prev: number }[]
  daily: { date: string; visitors: number; series: Record<string, number> }[]
  pages: { path: string; views: number; avgTime: number }[]
  referrers: { host: string; visits: number }[]
  devices: Record<string, number>
  funnels: { label: string; steps: { label: string; value: number }[] }[]
  attention: { label: string; value: number; tone?: "alert" | "ok" }[]
}
