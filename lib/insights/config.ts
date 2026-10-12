// lib/insights/config.ts
// EGOFF Essentials's InsightsConfig. Sales come from this site's own orders table.
import type { ResultSet } from "@libsql/client"
import type { DayRange, DayValue, InsightsConfig } from "./types"
import { localDay, addDays } from "./core"

const TZ = "America/Chicago"

// SQLite datetime('now') is UTC, "YYYY-MM-DD HH:MM:SS".
const since = (r: DayRange) => `${addDays(r.start, -1)} 00:00:00`
function rowsOf(res: ResultSet, map: (v: number) => number = (v) => v): DayValue[] {
  return res.rows.map((row) => ({
    date: localDay(new Date(String(row.ts).replace(" ", "T") + "Z"), TZ),
    value: map(Number(row.v) || 0),
  }))
}

export const insightsConfig: InsightsConfig = {
  siteName: "EGOFF Essentials",
  eventsTable: "egoff_site_events",
  timezone: TZ,
  eventTypes: ["page_view", "page_time", "checkout_click"],
  sources: [
    {
      key: "revenue", label: "Revenue", format: "money",
      fetch: async (r, db) => rowsOf(await db.execute({ sql: "SELECT created_at AS ts, amount_cents AS v FROM orders WHERE status = 'paid' AND created_at >= ?", args: [since(r)] }), (v) => v / 100),
    },
    {
      key: "sales", label: "Paid orders", format: "count",
      fetch: async (r, db) => rowsOf(await db.execute({ sql: "SELECT created_at AS ts, 1 AS v FROM orders WHERE status = 'paid' AND created_at >= ?", args: [since(r)] })),
    },
    {
      key: "requests", label: "Order requests", format: "count",
      fetch: async (r, db) => rowsOf(await db.execute({ sql: "SELECT created_at AS ts, 1 AS v FROM orders WHERE created_at >= ?", args: [since(r)] })),
    },
  ],
  funnels: [
    {
      label: "Placing an order",
      steps: [
        { label: "Visited the site", type: "page_view" },
        { label: "Submitted an order request", type: "checkout_click" },
      ],
    },
  ],
  attention: async (db) => {
    const r = await db.execute(
      "SELECT (SELECT COUNT(*) FROM orders WHERE status IN ('pending_review','awaiting_payment')) AS open, (SELECT COUNT(*) FROM orders WHERE notification_failed = 1) AS failed",
    )
    return [
      { label: "orders waiting on you", value: Number(r.rows[0]?.open ?? 0), tone: "alert" as const },
      { label: "order alerts that failed to email", value: Number(r.rows[0]?.failed ?? 0), tone: "alert" as const },
    ]
  },
}
