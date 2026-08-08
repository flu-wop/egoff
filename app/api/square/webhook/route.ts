import { WebhooksHelper } from "square";
import { getDb, initDb } from "@/lib/db";
import { sendPaymentConfirmedEmails, sendReconciliationAlert } from "@/lib/email";

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

type SquarePaymentEvent = {
  type: string;
  data?: {
    object?: {
      payment?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
  };
};

export async function POST(req: Request) {
  const sig = req.headers.get("x-square-hmacsha256-signature");
  const raw = await req.text(); // RAW body — must verify before parsing

  if (!sig) {
    return new Response("Missing x-square-hmacsha256-signature header", { status: 400 });
  }

  const notificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/square/webhook`;
  const isValid = await WebhooksHelper.verifySignature({
    requestBody: raw,
    signatureHeader: sig,
    signatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!,
    notificationUrl,
  });

  if (!isValid) {
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  const event = JSON.parse(raw) as SquarePaymentEvent;

  // Square fires payment.created immediately and payment.updated as status
  // changes. Card payments through a Payment Link typically land on
  // COMPLETED on one of these — only act once we see that status.
  if (
    (event.type === "payment.created" || event.type === "payment.updated") &&
    event.data?.object?.payment?.status === "COMPLETED"
  ) {
    const payment = event.data.object.payment;
    // square_order_id is the Square Order created alongside the Payment
    // Link (see /api/admin/orders/send-payment-link), stored via its
    // referenceId — that referenceId is our own orders.id, round-tripped
    // here as the reconciliation key. Square's own order_id on the payment
    // is Square's ID, not ours, so we look up by referenceId instead.
    const paymentId = payment?.id;
    const squareOrderId = payment?.order_id;

    if (!squareOrderId) {
      console.error("[webhook] payment.completed with no order_id:", paymentId);
      try {
        await sendReconciliationAlert({
          stripeSessionId: paymentId || "unknown",
          reason: "Payment completed with no order_id on the Square payment object.",
        });
      } catch (err) {
        console.error("[webhook] reconciliation alert failed to send:", err);
      }
      return new Response("ok (no order_id)", { status: 200 });
    }

    await initDb();
    const db = getDb();

    // IDEMPOTENCY: only flip pending/awaiting orders to paid, never twice.
    // stripe_session_id holds the Square Order ID here — see the note in
    // send-payment-link/route.ts on why the column name stayed as-is.
    const result = await db.execute({
      sql: `UPDATE orders SET status = 'paid'
            WHERE stripe_session_id = ? AND status != 'paid'`,
      args: [squareOrderId],
    });

    if (result.rowsAffected === 0) {
      // Two very different cases hide behind "0 rows updated" — distinguish
      // them instead of treating both as a harmless duplicate.
      const check = await db.execute({
        sql: `SELECT status FROM orders WHERE stripe_session_id = ?`,
        args: [squareOrderId],
      });
      const existing = check.rows[0] as unknown as { status: string } | undefined;

      if (!existing) {
        // The order_id doesn't match any row — real money moved, no
        // matching record. This is the case the audit flagged: don't let
        // it be silent.
        console.error("[webhook] payment references unknown Square order_id:", squareOrderId, paymentId);
        try {
          await sendReconciliationAlert({
            stripeSessionId: paymentId || "unknown",
            orderId: squareOrderId,
            reason: `Payment references Square order_id ${squareOrderId}, which doesn't match any order in the orders table.`,
          });
        } catch (err) {
          console.error("[webhook] reconciliation alert failed to send:", err);
        }
      }
      // else: existing.status === 'paid' already — genuine Square retry of
      // an event we've already processed. Expected, harmless, no alert needed.

      return new Response("ok (duplicate or unknown order)", { status: 200 });
    }

    const orderResult = await db.execute({
      sql: `SELECT * FROM orders WHERE stripe_session_id = ?`,
      args: [squareOrderId],
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
