import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (_resend) return _resend;
  _resend = new Resend(process.env.RESEND_API_KEY!);
  return _resend;
}

type OrderEmailPayload = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_street: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  notes: string;
  items: string; // JSON string: [{ name, price, qty }]
  amount_cents: string;
};

type OrderItem = { name: string; price: number; qty: number };

function parseItems(itemsJson: string): OrderItem[] {
  try {
    const parsed = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function itemsRowsHtml(items: OrderItem[]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d5;color:#1a1a1a;">${escapeHtml(
            item.name
          )}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d5;text-align:center;color:#1a1a1a;">×${item.qty}</td>
          <td style="padding:10px 0;border-bottom:1px solid #e5e0d5;text-align:right;color:#1a1a1a;">$${(
            item.price * item.qty
          ).toFixed(2)}</td>
        </tr>`
    )
    .join("");
}

function sanitizeForHeader(str: string): string {
  return String(str).replace(/[\r\n\t]/g, " ").slice(0, 200);
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailShell(bodyHtml: string): string {
  return `
  <div style="background:#FAF8F2;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e0d5;">
      <div style="background:#006400;padding:24px 32px;">
        <div style="color:#F4C430;font-size:22px;letter-spacing:1px;font-weight:bold;">EGOFF ESSENTIALS</div>
        <div style="color:#FAF8F2;font-size:12px;letter-spacing:2px;margin-top:4px;">ESSENTIALLY ROOTED</div>
      </div>
      <div style="padding:32px;">
        ${bodyHtml}
      </div>
      <div style="background:#FAF8F2;padding:20px 32px;border-top:1px solid #e5e0d5;color:#6b6b6b;font-size:12px;">
        EGOFF Essentials · (504) 957-0324 · Tue–Fri 9am–4pm CST
      </div>
    </div>
  </div>`;
}

function orderTable(items: OrderItem[], total: string): string {
  return `
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      ${itemsRowsHtml(items)}
      <tr>
        <td colspan="2" style="padding:14px 0 0;font-weight:bold;color:#006400;">Total</td>
        <td style="padding:14px 0 0;text-align:right;font-weight:bold;color:#006400;">$${total}</td>
      </tr>
    </table>`;
}

function shippingBlockHtml(order: OrderEmailPayload): string {
  return `${escapeHtml(order.shipping_street)}<br/>${escapeHtml(order.shipping_city)}, ${escapeHtml(
    order.shipping_state
  )} ${escapeHtml(order.shipping_zip)}`;
}

// ── STAGE 1: order request submitted (no payment yet) ──────────────────
// Customer gets "we received it, Ericka will confirm availability."
// Ericka gets "review this in the admin panel and send a payment link."
export async function sendOrderRequestEmails(order: OrderEmailPayload): Promise<void> {
  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const owner = process.env.RESEND_TO_EMAIL!;
  const items = parseItems(order.items);
  const total = (Number(order.amount_cents) / 100).toFixed(2);

  await resend.emails.send({
    from,
    to: order.customer_email,
    subject: "We received your EGOFF Essentials order request",
    html: emailShell(`
      <p style="color:#1a1a1a;font-size:16px;">Thank you, ${escapeHtml(
        order.customer_name
      )} — we've received your order request.</p>
      ${orderTable(items, total)}
      <p style="color:#1a1a1a;font-size:14px;margin-top:24px;"><strong>Shipping to:</strong><br/>${shippingBlockHtml(order)}</p>
      <p style="color:#6b6b6b;font-size:13px;margin-top:24px;">We'll confirm availability and send you a secure payment link shortly. Questions? Call (504) 957-0324, Tue–Fri 9am–4pm CST.</p>
    `),
  });

  await resend.emails.send({
    from,
    to: owner,
    subject: `New order request — ${sanitizeForHeader(order.customer_name)} — $${total}`,
    html: emailShell(`
      <p style="color:#1a1a1a;font-size:16px;font-weight:bold;">New order request — review needed</p>
      <p style="color:#1a1a1a;font-size:14px;">
        ${escapeHtml(order.customer_name)}<br/>
        ${escapeHtml(order.customer_email)}${order.customer_phone ? " · " + escapeHtml(order.customer_phone) : ""}
      </p>
      ${orderTable(items, total)}
      <p style="color:#1a1a1a;font-size:14px;"><strong>Ship to:</strong><br/>${shippingBlockHtml(order)}</p>
      ${order.notes ? `<p style="color:#1a1a1a;font-size:14px;"><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>` : ""}
      <p style="color:#6b6b6b;font-size:13px;margin-top:20px;">Confirm availability, then send the payment link from /admin/orders.</p>
    `),
  });
}

// ── STAGE 2: Ericka confirmed availability, payment link sent ──────────
export async function sendPaymentLinkEmail(
  order: OrderEmailPayload,
  paymentUrl: string
): Promise<void> {
  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const items = parseItems(order.items);
  const total = (Number(order.amount_cents) / 100).toFixed(2);

  await resend.emails.send({
    from,
    to: order.customer_email,
    subject: "Your EGOFF Essentials order is confirmed — payment link inside",
    html: emailShell(`
      <p style="color:#1a1a1a;font-size:16px;">Good news, ${escapeHtml(
        order.customer_name
      )} — your order is available and ready to go.</p>
      ${orderTable(items, total)}
      <p style="text-align:center;margin:28px 0;">
        <a href="${paymentUrl}" style="display:inline-block;background:#006400;color:#F4C430;padding:14px 32px;text-decoration:none;font-weight:bold;">Pay $${total} Now</a>
      </p>
      <p style="color:#6b6b6b;font-size:13px;">This secure link is powered by Stripe. Questions? Call (504) 957-0324, Tue–Fri 9am–4pm CST.</p>
    `),
  });
}

// ── STAGE 3: payment actually completed (fired from the Stripe webhook) ─
export async function sendPaymentConfirmedEmails(order: OrderEmailPayload): Promise<void> {
  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const owner = process.env.RESEND_TO_EMAIL!;
  const items = parseItems(order.items);
  const total = (Number(order.amount_cents) / 100).toFixed(2);

  await resend.emails.send({
    from,
    to: order.customer_email,
    subject: "Payment received — your EGOFF Essentials order is confirmed",
    html: emailShell(`
      <p style="color:#1a1a1a;font-size:16px;">Thank you, ${escapeHtml(
        order.customer_name
      )} — your payment was received.</p>
      ${orderTable(items, total)}
      <p style="color:#1a1a1a;font-size:14px;margin-top:24px;"><strong>Shipping to:</strong><br/>${shippingBlockHtml(order)}</p>
      <p style="color:#6b6b6b;font-size:13px;margin-top:24px;">We'll follow up with shipping updates. Questions? Call (504) 957-0324, Tue–Fri 9am–4pm CST.</p>
    `),
  });

  await resend.emails.send({
    from,
    to: owner,
    subject: `Payment received — ${sanitizeForHeader(order.customer_name)} — $${total}`,
    html: emailShell(`
      <p style="color:#1a1a1a;font-size:16px;font-weight:bold;">Payment received</p>
      <p style="color:#1a1a1a;font-size:14px;">${escapeHtml(order.customer_name)} · ${escapeHtml(order.customer_email)}</p>
      ${orderTable(items, total)}
    `),
  });
}
