import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import { sendPaymentLinkEmail } from "@/lib/email";

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
  status: string;
};

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
  if (order.status === "paid") {
    return NextResponse.json({ error: "Order is already paid" }, { status: 409 });
  }

  let items: { name: string; price: number; qty: number }[] = [];
  try {
    items = JSON.parse(order.items);
  } catch {
    return NextResponse.json({ error: "Order has corrupted item data" }, { status: 500 });
  }
  if (items.length === 0) {
    return NextResponse.json({ error: "Order has no items" }, { status: 400 });
  }

  const stripe = getStripe();
  let paymentLink;
  try {
    paymentLink = await stripe.paymentLinks.create({
      line_items: items.map((item) => ({
        quantity: item.qty,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.price * 100),
          product_data: { name: item.name },
        },
      })),
      // Copied through to the resulting checkout.session.completed webhook
      // event — this is how we reconcile payment back to this exact order.
      metadata: { order_id: String(order.id) },
      after_completion: {
        type: "redirect",
        redirect: { url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success` },
      },
    });
  } catch (err) {
    console.error("[send-payment-link] Stripe payment link creation failed:", err);
    return NextResponse.json({ error: "Failed to create payment link" }, { status: 502 });
  }

  await db.execute({
    sql: `UPDATE orders SET status = 'awaiting_payment', stripe_session_id = ? WHERE id = ?`,
    args: [paymentLink.id, order.id],
  });

  try {
    await sendPaymentLinkEmail(
      {
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
      },
      paymentLink.url
    );
  } catch (err) {
    console.error("[send-payment-link] email send failed:", err);
    // Link was created and order updated — surface this so the admin knows
    // to share the link manually rather than assuming the customer got it.
    return NextResponse.json(
      { ok: true, url: paymentLink.url, emailFailed: true },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, url: paymentLink.url });
}
