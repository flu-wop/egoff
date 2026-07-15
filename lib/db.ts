import { createClient, type Client } from "@libsql/client";

// Lazy init is mandatory — never create the client at module top-level.
// See booking-system skill: top-level createClient() crashes the Vercel
// build because env vars aren't present at build time.
let _db: Client | null = null;

export function getDb(): Client {
  if (_db) return _db;
  _db = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  return _db;
}

// Call once (see scripts/init-db.ts) or on first cold start. Idempotent.
export async function initDb() {
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      shipping_street TEXT NOT NULL,
      shipping_city TEXT NOT NULL,
      shipping_state TEXT NOT NULL,
      shipping_zip TEXT NOT NULL,
      notes TEXT,
      items TEXT NOT NULL,             -- JSON: [{ name, price, qty }]
      amount_cents INTEGER NOT NULL,   -- server-computed total, source of truth
      stripe_session_id TEXT UNIQUE,
      status TEXT DEFAULT 'pending',   -- pending | paid | cancelled
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS newsletter (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // rate_limits table is created lazily by lib/rate-limit.ts in step 9
  // (site-security skill) — not duplicated here.
}
