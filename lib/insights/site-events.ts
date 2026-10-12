// src/lib/insights/site-events.ts
// First-party, cookieless browsing events. The table name comes from the
// site's InsightsConfig so sites that share one database never mix events.
// New table, so CREATE IF NOT EXISTS is enough; any later column needs its
// own ALTER TABLE migration.
import type { Client } from "@libsql/client"

const ready = new Map<string, Promise<void>>()

export function safeTable(name: string): string {
  if (!/^[a-z][a-z0-9_]{2,40}$/.test(name)) throw new Error(`Bad events table name: ${name}`)
  return name
}

export function ensureSiteEvents(db: Client, table: string): Promise<void> {
  const t = safeTable(table)
  let p = ready.get(t)
  if (!p) {
    p = (async () => {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS ${t} (
          id     INTEGER PRIMARY KEY AUTOINCREMENT,
          ts     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
          sid    TEXT NOT NULL,
          type   TEXT NOT NULL,
          path   TEXT,
          item   TEXT,
          value  REAL,
          ref    TEXT,
          device TEXT
        )
      `)
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_${t}_ts ON ${t} (ts)`)
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_${t}_sid ON ${t} (sid)`)
    })().catch((err) => { ready.delete(t); throw err })
    ready.set(t, p)
  }
  return p
}
