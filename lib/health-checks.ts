import { getDb } from "@/lib/db";
import { getSquare } from "@/lib/square";
import { Resend } from "resend";

export type CheckResult = { status: "ok" | "warn" | "error"; detail: string };

// ---- 1. Env Var Status ----
const REQUIRED_ENV_VARS = [
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "SQUARE_ACCESS_TOKEN",
  "SQUARE_LOCATION_ID",
  "SQUARE_ENVIRONMENT",
  "SQUARE_WEBHOOK_SIGNATURE_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "RESEND_TO_EMAIL",
  "ADMIN_PASSWORD",
  "NEXT_PUBLIC_SITE_URL",
];

export function checkEnvVars(): Record<string, CheckResult> {
  const results: Record<string, CheckResult> = {};
  for (const key of REQUIRED_ENV_VARS) {
    const present = !!process.env[key];
    results[key] = {
      status: present ? "ok" : "error",
      detail: present ? "set" : "MISSING",
    };
  }
  return results;
}

// ---- 2. Webhook Health ----
export async function checkSquare(): Promise<CheckResult> {
  try {
    const square = getSquare();
    // Lightweight call that just confirms the token + location are valid.
    const res = await square.locations.get({ locationId: process.env.SQUARE_LOCATION_ID! });
    const name = res.location?.name || "unknown location";
    return { status: "ok", detail: `Connected — ${name} (${process.env.SQUARE_ENVIRONMENT || "sandbox"})` };
  } catch (err) {
    return { status: "error", detail: `Square API error: ${(err as Error).message}` };
  }
}

export async function checkLastOrderWebhook(): Promise<CheckResult> {
  try {
    const db = getDb();
    const result = await db.execute(
      "SELECT created_at, status FROM orders ORDER BY created_at DESC LIMIT 1"
    );
    if (result.rows.length === 0) return { status: "warn", detail: "No orders yet" };
    const row = result.rows[0] as unknown as { created_at: string; status: string };
    const last = new Date(row.created_at);
    const hoursAgo = (Date.now() - last.getTime()) / 3_600_000;
    if (hoursAgo > 24 * 14) {
      return { status: "warn", detail: `Last order ${Math.round(hoursAgo / 24)} days ago (status: ${row.status})` };
    }
    return { status: "ok", detail: `Last order ${last.toLocaleString()} (status: ${row.status})` };
  } catch (err) {
    return { status: "error", detail: `DB read failed: ${(err as Error).message}` };
  }
}

export async function checkResend(): Promise<CheckResult> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const domains = await resend.domains.list();
    const fromDomain = (process.env.RESEND_FROM_EMAIL || "").split("@")[1];
    if (!fromDomain || fromDomain === "resend.dev") {
      return { status: "warn", detail: "Using resend.dev fallback — egoffessentials.com not verified yet" };
    }
    const match = domains.data?.data?.find((d: { name: string }) => d.name === fromDomain);
    if (!match) return { status: "error", detail: `Domain ${fromDomain} not found in Resend account` };
    if (match.status !== "verified") return { status: "error", detail: `Domain status: ${match.status}` };
    return { status: "ok", detail: `${fromDomain} verified` };
  } catch (err) {
    return { status: "error", detail: `Resend API error: ${(err as Error).message}` };
  }
}

export async function checkTurso(): Promise<CheckResult> {
  try {
    const db = getDb();
    await db.execute("SELECT 1");
    return { status: "ok", detail: "Connected" };
  } catch (err) {
    return { status: "error", detail: `Turso connection failed: ${(err as Error).message}` };
  }
}

// ---- 3. API Usage (self-tracked, no provider quota endpoint used) ----
export async function checkApiUsage(): Promise<CheckResult> {
  try {
    const db = getDb();
    const result = await db.execute(
      "SELECT status, COUNT(*) as count FROM orders WHERE created_at > datetime('now', '-30 days') GROUP BY status"
    );
    const summary =
      result.rows
        .map((r) => `${(r as unknown as { status: string; count: number }).status}: ${(r as unknown as { status: string; count: number }).count}`)
        .join(", ") || "No orders in the last 30 days";
    return { status: "ok", detail: summary };
  } catch (err) {
    return { status: "warn", detail: `Usage check failed: ${(err as Error).message}` };
  }
}

// Note: EGOFF has no `products` table (catalog lives in lib/products.ts, not
// Printify-synced), so there is no Product Sync panel here — that panel is
// conditional per the admin-dashboard skill and only applies to Printify-backed
// merch sites (e.g. Epoch Skin), not EGOFF's own-catalog soap/body-butter line.
