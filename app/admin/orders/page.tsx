import { getDb, initDb } from "@/lib/db";
import AdminHeader from "../AdminHeader";
import SendPaymentLinkButton from "./SendPaymentLinkButton";

export const dynamic = "force-dynamic";

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
  stripe_session_id: string; // holds the Square Order ID now — column name kept as-is (see webhook route.ts)
  status: string;
  notification_failed: number;
  created_at: string;
};

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  paid: { bg: "#0a2218", fg: "#d9a441", label: "Paid" },
  awaiting_payment: { bg: "#f4c430", fg: "#1a1a1a", label: "Awaiting Payment" },
  pending_review: { bg: "#e5e0d5", fg: "#4a4a4a", label: "Pending Review" },
  cancelled: { bg: "#f3e0e0", fg: "#8a3a3a", label: "Cancelled" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || { bg: "#e5e0d5", fg: "#4a4a4a", label: status.replace(/_/g, " ") };
  return (
    <span
      className="inline-block font-cinzel text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso.replace(" ", "T") + "Z").toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function AdminOrdersPage() {
  await initDb();
  const db = getDb();
  const result = await db.execute("SELECT * FROM orders ORDER BY created_at DESC");
  const orders = result.rows as unknown as OrderRow[];

  const totals = {
    pending: orders.filter((o) => o.status === "pending_review").length,
    awaiting: orders.filter((o) => o.status === "awaiting_payment").length,
    paid: orders.filter((o) => o.status === "paid").length,
    revenue: orders.filter((o) => o.status === "paid").reduce((sum, o) => sum + o.amount_cents, 0),
  };

  return (
    <div style={{ background: "#fffdf7", minHeight: "100vh" }}>
      <AdminHeader active="orders" subtitle={`ORDERS · ${orders.length} TOTAL`} />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        {/* Summary stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Pending Review", value: totals.pending, accent: "#4a4a4a" },
            { label: "Awaiting Payment", value: totals.awaiting, accent: "#b7791f" },
            { label: "Paid Orders", value: totals.paid, accent: "#0a2218" },
            { label: "Total Revenue", value: `$${(totals.revenue / 100).toFixed(2)}`, accent: "#0a2218" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg px-4 py-3.5"
              style={{ background: "#fff", border: "1px solid #e5e0d5" }}
            >
              <p className="font-cinzel text-[10px] tracking-widest uppercase mb-1" style={{ color: "#9a9a9a" }}>
                {stat.label}
              </p>
              <p className="font-cormorant text-2xl font-semibold" style={{ color: stat.accent }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {orders.length === 0 && (
          <div className="text-center py-20 rounded-lg" style={{ background: "#fff", border: "1px dashed #e5e0d5" }}>
            <p className="font-cormorant text-xl" style={{ color: "#9a9a9a" }}>
              No orders yet — new order requests will appear here.
            </p>
          </div>
        )}

        {orders.length > 0 && (
          <>
            {/* Mobile: card list */}
            <div className="flex flex-col gap-3 sm:hidden">
              {orders.map((o) => {
                let items: { name: string; qty: number }[] = [];
                try {
                  items = JSON.parse(o.items);
                } catch {}
                return (
                  <div
                    key={o.id}
                    className="rounded-lg p-4"
                    style={{ background: "#fff", border: "1px solid #e5e0d5" }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-cormorant text-lg font-semibold" style={{ color: "#1a1a1a" }}>
                          {o.customer_name}
                        </p>
                        <p className="text-xs" style={{ color: "#8a8a8a" }}>
                          {o.customer_email}
                        </p>
                      </div>
                      <StatusPill status={o.status} />
                    </div>
                    {o.notification_failed === 1 && (
                      <p
                        className="text-[11px] font-semibold mb-2 px-2 py-1 rounded inline-block"
                        style={{ background: "#fde8e8", color: "#b91c1c" }}
                      >
                        ⚠ Notification email failed
                      </p>
                    )}
                    <div className="text-xs mb-2" style={{ color: "#4a4a4a" }}>
                      {items.map((it, i) => (
                        <div key={i}>
                          {it.name} ×{it.qty}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mb-2" style={{ color: "#8a8a8a" }}>
                      {o.shipping_street}, {o.shipping_city}, {o.shipping_state} {o.shipping_zip}
                    </p>
                    <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid #f0ece0" }}>
                      <span className="font-cormorant text-lg font-bold" style={{ color: "#0a2218" }}>
                        ${(o.amount_cents / 100).toFixed(2)}
                      </span>
                      <span className="text-[11px]" style={{ color: "#9a9a9a" }}>
                        {formatDate(o.created_at)}
                      </span>
                    </div>
                    <div className="mt-3">
                      <SendPaymentLinkButton orderId={o.id} status={o.status} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: table */}
            <div
              className="hidden sm:block rounded-lg overflow-hidden"
              style={{ background: "#fff", border: "1px solid #e5e0d5" }}
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ background: "#0a2218" }}>
                    {["Date", "Customer", "Items", "Total", "Status", "Ship To", "Action"].map((h) => (
                      <th
                        key={h}
                        className="font-cinzel text-[10px] tracking-widest uppercase text-left px-4 py-3"
                        style={{ color: "#d9a441" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => {
                    let items: { name: string; qty: number }[] = [];
                    try {
                      items = JSON.parse(o.items);
                    } catch {}
                    return (
                      <tr
                        key={o.id}
                        style={{
                          borderTop: "1px solid #f0ece0",
                          background: i % 2 === 0 ? "#fff" : "#fdfbf5",
                        }}
                      >
                        <td className="px-4 py-3.5 text-xs align-top" style={{ color: "#8a8a8a" }}>
                          {formatDate(o.created_at)}
                        </td>
                        <td className="px-4 py-3.5 text-xs align-top">
                          <div className="font-medium" style={{ color: "#1a1a1a" }}>
                            {o.customer_name}
                          </div>
                          <div style={{ color: "#8a8a8a" }}>{o.customer_email}</div>
                          {o.notification_failed === 1 && (
                            <span
                              className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded"
                              style={{ background: "#fde8e8", color: "#b91c1c" }}
                            >
                              ⚠ Notification failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs align-top" style={{ color: "#4a4a4a" }}>
                          {items.map((it, idx) => (
                            <div key={idx}>
                              {it.name} ×{it.qty}
                            </div>
                          ))}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-bold align-top" style={{ color: "#0a2218" }}>
                          ${(o.amount_cents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <StatusPill status={o.status} />
                        </td>
                        <td className="px-4 py-3.5 text-xs align-top" style={{ color: "#4a4a4a" }}>
                          {o.shipping_street}, {o.shipping_city}, {o.shipping_state} {o.shipping_zip}
                        </td>
                        <td className="px-4 py-3.5 align-top">
                          <SendPaymentLinkButton orderId={o.id} status={o.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
