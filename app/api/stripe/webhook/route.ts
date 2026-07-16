import { getStripe } from "@/lib/stripe";
import { getDb, initDb } from "@/lib/db";
import { sendPaymentConfirmedEmails } from "@/lib/email";
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
      // Not something a retry would fix — 200 to stop Stripe from retrying,
      // but this is logged for manual investigation.
      return new Response("ok (no order_id)", { status: 200 });
    }

    await initDb();
    const db = getDb();

    // IDEMPOTENCY: only flip pending/awaiting orders to paid, never twice.
    // A retry of the same event hits `status = 'paid'` already and updates 0 rows.
    const result = await db.execute({
      sql: `UPDATE orders SET status = 'paid', stripe_session_id = ?
            WHERE id = ? AND status != 'paid'`,
      args: [s.id, orderId],
    });

    if (result.rowsAffected === 0) {
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
