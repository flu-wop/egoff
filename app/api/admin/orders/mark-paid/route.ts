import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";

export const runtime = "nodejs";

type OrderRow = {
  id: number;
  status: string;
};

// Manual "I got paid outside Square" action — for Zelle, cash, or any
// payment Ericka confirms herself. The Square payment-link flow
// (send-payment-link/route.ts) is the only other path to 'paid', and it
// only fires via the Square webhook, so a Zelle-paid order would otherwise
// be stuck at 'pending_review' forever with no way to mark it ready to ship.
// Auth is enforced by proxy.ts (matcher covers /api/admin/:path*).
export async function POST(req: Request) {
  let body: { orderId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const orderId = Number(body.orderId);
  if (!orderId || !Number.isInteger(orderId)) {
    return NextResponse.json({ error: "Missing or invalid orderId" }, { status: 400 });
  }

  await initDb();
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT id, status FROM orders WHERE id = ?`,
    args: [orderId],
  });
  const order = result.rows[0] as unknown as OrderRow | undefined;

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.status === "paid") {
    return NextResponse.json({ error: "Order is already paid" }, { status: 409 });
  }

  await db.execute({
    sql: `UPDATE orders SET status = 'paid' WHERE id = ?`,
    args: [orderId],
  });

  return NextResponse.json({ ok: true });
}
