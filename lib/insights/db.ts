// lib/insights/db.ts
// Insights' handle on this site's existing Turso database. Returns null when
// TURSO_URL isn't set, so pages and the beacon degrade instead of throwing.
import type { Client } from "@libsql/client"
import { getDb } from "@/lib/db"

export function getDB(): Client | null {
  if (!process.env.TURSO_URL) return null
  return getDb()
}
