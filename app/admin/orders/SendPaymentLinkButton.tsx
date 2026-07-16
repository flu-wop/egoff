"use client";

import { useState } from "react";

export default function SendPaymentLinkButton({
  orderId,
  status,
}: {
  orderId: number;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/orders/send-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult(data.emailFailed ? "Link created, email failed — copy manually" : "Sent!");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (status === "paid") {
    return <span style={{ color: "#6b6b6b", fontSize: 12 }}>—</span>;
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          background: status === "awaiting_payment" ? "#F4C430" : "#006400",
          color: status === "awaiting_payment" ? "#1a1a1a" : "#F4C430",
          border: "none",
          padding: "6px 12px",
          fontSize: 12,
          fontWeight: "bold",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "..." : status === "awaiting_payment" ? "Resend Link" : "Send Payment Link"}
      </button>
      {result && <div style={{ fontSize: 11, marginTop: 4, color: "#6b6b6b" }}>{result}</div>}
    </div>
  );
}
