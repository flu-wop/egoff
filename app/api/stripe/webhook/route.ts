import { getStripe } from "@/lib/stripe";
import { getDb, initDb } from "@/lib/db";
import { sendOrderEmails } from "@/lib/email";
import type Stripe from "stripe";

export const runtime = "nodejs";

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
    const m = s.metadata || {};

    await initDb();
    const db = getDb();

    // IDEMPOTENCY: stripe_session_id is UNIQUE. Stripe retries the same
    // event on timeout/non-200 responses — INSERT OR IGNORE means a retry
    // never creates a duplicate order or fires duplicate emails.
    const result = await db.execute({
      sql: `INSERT OR IGNORE INTO orders
              (customer_name, customer_email, customer_phone, shipping_street,
               shipping_city, shipping_state, shipping_zip, notes, items,
               amount_cents, stripe_session_id, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?, 'paid')`,
      args: [
        m.customer_name ?? "",
        m.customer_email ?? "",
        m.customer_phone ?? "",
        m.shipping_street ?? "",
        m.shipping_city ?? "",
        m.shipping_state ?? "",
        m.shipping_zip ?? "",
        m.notes ?? "",
        m.items ?? "[]",
        Number(m.amount_cents ?? 0),
        s.id,
      ],
    });

    if (result.rowsAffected === 0) {
      // Duplicate delivery of an event we already processed — do not resend emails.
      return new Response("ok (duplicate)", { status: 200 });
    }

    // Never fail the webhook (and never trigger a Stripe retry / duplicate
    // order) just because email sending had a problem.
    try {
      await sendOrderEmails({
        customer_name: m.customer_name ?? "",
        customer_email: m.customer_email ?? "",
        customer_phone: m.customer_phone ?? "",
        shipping_street: m.shipping_street ?? "",
        shipping_city: m.shipping_city ?? "",
        shipping_state: m.shipping_state ?? "",
        shipping_zip: m.shipping_zip ?? "",
        notes: m.notes ?? "",
        items: m.items ?? "[]",
        amount_cents: m.amount_cents ?? "0",
      });
    } catch (err) {
      console.error("[webhook] order email send failed:", err);
    }
  }

  return new Response("ok", { status: 200 });
}
