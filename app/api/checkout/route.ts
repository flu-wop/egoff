import { NextResponse } from "next/server";
import { priceCart, type CartInput } from "@/lib/products";
import { rateLimit } from "@/lib/rate-limit";
import { getDb, initDb } from "@/lib/db";
import { sendOrderRequestEmails } from "@/lib/email";

export const runtime = "nodejs";

type CheckoutBody = {
  cart: CartInput[];
  name: string;
  email: string;
  phone?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
};

function getIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function cap(str: string, max: number): string {
  return String(str || "").trim().slice(0, max);
}

// This is an ORDER REQUEST, not a payment. No card is charged here — Ericka
// reviews it in /admin/orders, confirms availability, then sends a Stripe
// Payment Link for the customer to actually pay. See lib/products.ts for
// the server-side price catalog that locks in the amount at request time.
export async function POST(req: Request) {
  const ip = getIp(req);
  const allowed = await rateLimit(`checkout:${ip}`, 10, 10 * 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429 }
    );
  }

  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = cap(body.name, 100);
  const email = cap(body.email, 200);
  const phone = cap(body.phone || "", 30);
  const street = cap(body.street, 200);
  const city = cap(body.city, 100);
  const state = cap(body.state, 50);
  const zip = cap(body.zip, 10);
  const notes = cap(body.notes || "", 400);

  if (!name || !email || !street || !city || !state || !zip) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!email.includes("@") || !email.includes(".")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  let lineItems, amountCents;
  try {
    ({ lineItems, amountCents } = priceCart(body.cart));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid cart" },
      { status: 400 }
    );
  }

  const itemsJson = JSON.stringify(lineItems);
  if (itemsJson.length > 480) {
    return NextResponse.json(
      { error: "Cart is too large to process in one order. Please split into multiple orders." },
      { status: 400 }
    );
  }

  await initDb();
  const db = getDb();
  let orderId: number;
  try {
    const result = await db.execute({
      sql: `INSERT INTO orders
              (customer_name, customer_email, customer_phone, shipping_street,
               shipping_city, shipping_state, shipping_zip, notes, items,
               amount_cents, status)
            VALUES (?,?,?,?,?,?,?,?,?,?, 'pending_review')`,
      args: [name, email, phone, street, city, state, zip, notes, itemsJson, amountCents],
    });
    orderId = Number(result.lastInsertRowid);
  } catch (err) {
    console.error("[checkout] order save failed:", err);
    return NextResponse.json(
      { error: "Something went wrong saving your order. Please try again or call (504) 957-0324." },
      { status: 500 }
    );
  }

  try {
    await sendOrderRequestEmails({
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      shipping_street: street,
      shipping_city: city,
      shipping_state: state,
      shipping_zip: zip,
      notes,
      items: itemsJson,
      amount_cents: String(amountCents),
    });
  } catch (err) {
    // Order is already saved — don't fail the request over an email hiccup.
    console.error("[checkout] order-request email send failed:", err);
  }

  return NextResponse.json({ ok: true, orderId });
}
