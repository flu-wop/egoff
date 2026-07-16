import { getStripe } from "@/lib/stripe";
import { getDb, initDb } from "@/lib/db";
import { sendPaymentConfirmedEmails, sendReconciliationAlert } from "@/lib/email";
import type Stripe from "stripe";

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

export async function POST(req: Request) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text(); // RAW body — must verify before parsing

  if (!sig) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${(err as Error).message}`, {
      status: 400,
    });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    // order_id is copied through from the Payment Link's metadata (set in
    // /api/admin/orders/send-payment-link) — this is how we reconcile the
    // payment back to the order row that already exists in our DB.
    const orderId = Number(s.metadata?.order_id);

    if (!orderId || !Number.isInteger(orderId)) {
      console.error("[webhook] checkout.session.completed with no valid order_id metadata:", s.id);
      try {
        await sendReconciliationAlert({
          stripeSessionId: s.id,
          reason: "Payment completed with no order_id in its metadata.",
        });
      } catch (err) {
        console.error("[webhook] reconciliation alert failed to send:", err);
      }
      return new Response("ok (no order_id)", { status: 200 });
    }

    await initDb();
    const db = getDb();

    // IDEMPOTENCY: only flip pending/awaiting orders to paid, never twice.
    const result = await db.execute({
      sql: `UPDATE orders SET status = 'paid', stripe_session_id = ?
            WHERE id = ? AND status != 'paid'`,
      args: [s.id, orderId],
    });

    if (result.rowsAffected === 0) {
      // Two very different cases hide behind "0 rows updated" — distinguish
      // them instead of treating both as a harmless duplicate.
      const check = await db.execute({
        sql: `SELECT status FROM orders WHERE id = ?`,
        args: [orderId],
      });
      const existing = check.rows[0] as unknown as { status: string } | undefined;

      if (!existing) {
        // The order_id doesn't exist at all — real money moved, no matching
        // record. This is the case the audit flagged: don't let it be silent.
        console.error("[webhook] payment references unknown order_id:", orderId, s.id);
        try {
          await sendReconciliationAlert({
            stripeSessionId: s.id,
            orderId: String(orderId),
            reason: `Payment references order_id ${orderId}, which doesn't exist in the orders table.`,
          });
        } catch (err) {
          console.error("[webhook] reconciliation alert failed to send:", err);
        }
      }
      // else: existing.status === 'paid' already — genuine Stripe retry of
      // an event we've already processed. Expected, harmless, no alert needed.

      return new Response("ok (duplicate or unknown order)", { status: 200 });
    }

    const orderResult = await db.execute({
      sql: `SELECT * FROM orders WHERE id = ?`,
      args: [orderId],
    });
    const order = orderResult.rows[0] as unknown as OrderRow | undefined;

    if (order) {
      try {
        await sendPaymentConfirmedEmails({
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
        console.error("[webhook] payment-confirmed email send failed:", err);
      }
    }
  }

  return new Response("ok", { status: 200 });
}
