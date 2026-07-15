import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { priceCart, type CartInput } from "@/lib/products";
import { rateLimit } from "@/lib/rate-limit";

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

// Stripe metadata values are capped at 500 chars each — truncate defensively
// rather than let a large cart silently corrupt the webhook's saved order.
function cap(str: string, max: number): string {
  return String(str || "").trim().slice(0, max);
}

export async function POST(req: Request) {
  const ip = getIp(req);
  const allowed = await rateLimit(`checkout:${ip}`, 10, 10 * 60);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please wait a few minutes and try again." },
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
    // Extremely large cart — reject cleanly rather than silently truncate
    // order data that the webhook will later save.
    return NextResponse.json(
      { error: "Cart is too large to process in one order. Please split into multiple orders." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems.map((item) => ({
        quantity: item.qty,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(item.price * 100),
          product_data: { name: item.name },
        },
      })),
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/?canceled=1`,
      customer_email: email,
      metadata: {
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
      },
    });
  } catch (err) {
    console.error("[checkout] Stripe session creation failed:", err);
    return NextResponse.json(
      { error: "Payment setup failed. Please try again or call (504) 957-0324." },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: session.url });
}
