import { getDb, initDb } from "@/lib/db";

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
  stripe_session_id: string;
  status: string;
  created_at: string;
};

export default async function AdminOrdersPage() {
  await initDb();
  const db = getDb();
  const result = await db.execute("SELECT * FROM orders ORDER BY created_at DESC");
  const orders = result.rows as unknown as OrderRow[];

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#FAF8F2", minHeight: "100vh" }}>
      <div
        style={{
          background: "#006400",
          padding: "20px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ color: "#F4C430", fontSize: 20, fontWeight: "bold" }}>EGOFF ESSENTIALS</div>
          <div style={{ color: "#FAF8F2", fontSize: 12, letterSpacing: 1 }}>
            ORDERS — {orders.length} total
          </div>
        </div>
        <a
          href="/api/admin/logout"
          style={{
            background: "transparent",
            border: "1px solid #F4C430",
            color: "#F4C430",
            padding: "6px 14px",
            textDecoration: "none",
            fontSize: 13,
          }}
        >
          Log Out
        </a>
      </div>

      <div style={{ padding: 32 }}>
        {orders.length === 0 && <p style={{ color: "#6b6b6b" }}>No orders yet.</p>}
        {orders.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #006400", textAlign: "left" }}>
                <th style={{ padding: 10 }}>Date</th>
                <th style={{ padding: 10 }}>Customer</th>
                <th style={{ padding: 10 }}>Items</th>
                <th style={{ padding: 10 }}>Total</th>
                <th style={{ padding: 10 }}>Status</th>
                <th style={{ padding: 10 }}>Ship To</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                let items: { name: string; qty: number }[] = [];
                try {
                  items = JSON.parse(o.items);
                } catch {}
                return (
                  <tr key={o.id} style={{ borderBottom: "1px solid #e5e0d5" }}>
                    <td style={{ padding: 10, fontSize: 13, color: "#6b6b6b" }}>{o.created_at}</td>
                    <td style={{ padding: 10, fontSize: 13 }}>
                      <div>{o.customer_name}</div>
                      <div style={{ color: "#6b6b6b" }}>{o.customer_email}</div>
                    </td>
                    <td style={{ padding: 10, fontSize: 13 }}>
                      {items.map((it, i) => (
                        <div key={i}>
                          {it.name} ×{it.qty}
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: 10, fontSize: 13, fontWeight: "bold", color: "#006400" }}>
                      ${(o.amount_cents / 100).toFixed(2)}
                    </td>
                    <td style={{ padding: 10, fontSize: 13 }}>{o.status}</td>
                    <td style={{ padding: 10, fontSize: 13 }}>
                      {o.shipping_street}, {o.shipping_city}, {o.shipping_state} {o.shipping_zip}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
