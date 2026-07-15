import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function getIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: Request) {
  const ip = getIp(req);
  const allowed = await rateLimit(`newsletter:${ip}`, 5, 10 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again shortly." }, { status: 429 });
  }

  let body: { name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = (body.name || "").trim().slice(0, 100);
  const email = (body.email || "").trim().slice(0, 200);

  if (!email.includes("@") || email.length < 5) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  await initDb();
  const db = getDb();
  await db.execute({
    sql: `INSERT OR IGNORE INTO newsletter (name, email) VALUES (?, ?)`,
    args: [name, email],
  });

  return NextResponse.json({ ok: true });
}
