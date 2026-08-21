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
    return <span className="text-xs" style={{ color: "#c0c0c0" }}>—</span>;
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="font-cinzel text-[11px] tracking-widest uppercase px-3.5 py-2 rounded-full transition-opacity"
        style={{
          background: status === "awaiting_payment" ? "#f4c430" : "#b7791f",
          color: status === "awaiting_payment" ? "#1a1a1a" : "#fffdf7",
          border: "none",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "…" : status === "awaiting_payment" ? "Resend Link" : "Send Payment Link"}
      </button>
      {result && (
        <div className="text-[11px] mt-1.5" style={{ color: "#8a8a8a" }}>
          {result}
        </div>
      )}
    </div>
  );
}
