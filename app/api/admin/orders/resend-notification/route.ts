import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { sendOrderRequestEmails } from "@/lib/email";

export const runtime = "nodejs";

type OrderRow = {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  notes: string;
  items: string;
  amount_cents: number;
};

// Retries the "order received" notification pair (customer + Ericka) for an
// order whose original send failed — see notification_failed on the orders
// table. Clears the flag only once the retry actually succeeds, so a
// second failure keeps the order visibly flagged in /admin/orders and on
// /admin/system instead of silently going quiet.
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
    sql: `SELECT * FROM orders WHERE id = ?`,
    args: [orderId],
  });
  const order = result.rows[0] as unknown as OrderRow | undefined;

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  try {
    await sendOrderRequestEmails({
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      shipping_street: order.shipping_street,
      shipping_city: order.shipping_city,
      shipping_state: order.shipping_state,
      shipping_zip: order.shipping_zip,
      notes: order.notes,
      items: order.items,
      amount_cents: String(order.amount_cents),
    });
  } catch (err) {
    console.error("[resend-notification] send failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Send failed" },
      { status: 502 }
    );
  }

  await db.execute({
    sql: `UPDATE orders SET notification_failed = 0 WHERE id = ?`,
    args: [orderId],
  });

  return NextResponse.json({ ok: true });
}
