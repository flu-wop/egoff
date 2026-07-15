"use client";

import { useEffect, useState } from "react";

export default function CheckoutSuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id"));
    // Payment succeeded (we only get here via Stripe's success_url) — safe to clear the cart now.
    localStorage.setItem("egoff-cart", "[]");
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAF8F2",
        fontFamily: "Georgia, serif",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e0d5",
          padding: "48px 40px",
          maxWidth: 440,
          textAlign: "center",
        }}
      >
        <div style={{ color: "#006400", fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>
          EGOFF ESSENTIALS
        </div>
        <div style={{ color: "#F4C430", fontSize: 12, letterSpacing: 2, marginBottom: 24 }}>
          ESSENTIALLY ROOTED
        </div>
        <h1 style={{ fontSize: 24, color: "#1a1a1a", marginBottom: 12 }}>
          Thank you — your order is confirmed
        </h1>
        <p style={{ color: "#6b6b6b", fontSize: 14, lineHeight: 1.6 }}>
          A confirmation email is on its way to you. We&apos;ll follow up with shipping updates.
          Questions? Call (504) 957-0324, Tue–Fri 9am–4pm CST.
        </p>
        {sessionId && (
          <p style={{ color: "#a3a3a3", fontSize: 11, marginTop: 24 }}>
            Order reference: {sessionId.slice(0, 24)}…
          </p>
        )}
        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: 28,
            background: "#006400",
            color: "#F4C430",
            padding: "12px 28px",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: "bold",
          }}
        >
          Back to EGOFF Essentials
        </a>
      </div>
    </div>
  );
}
