import SystemHealthClient from "./SystemHealthClient";

export const dynamic = "force-dynamic";

export default async function AdminSystemPage() {
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
          <div style={{ color: "#FAF8F2", fontSize: 12, letterSpacing: 1 }}>SYSTEM HEALTH</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a
            href="/admin/orders"
            style={{
              background: "transparent",
              border: "1px solid #F4C430",
              color: "#F4C430",
              padding: "6px 14px",
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            Orders
          </a>
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
      </div>

      <SystemHealthClient />
    </div>
  );
}
