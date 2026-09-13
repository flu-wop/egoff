import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | EGOFF Essentials",
  description: "EGOFF Essentials terms of service — orders, payment, and shipping.",
};

export default function TermsPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF8F2",
        fontFamily: "Georgia, serif",
        padding: "64px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #e5e0d5",
          padding: "48px 40px",
        }}
      >
        <div style={{ color: "#006400", fontSize: 20, fontWeight: "bold", marginBottom: 4 }}>
          EGOFF ESSENTIALS
        </div>
        <h1 style={{ fontSize: 28, color: "#1a1a1a", marginTop: 16, marginBottom: 4 }}>
          Terms of Service
        </h1>
        <p style={{ color: "#a3a3a3", fontSize: 12, marginBottom: 28 }}>
          Last updated: September 2026
        </p>

        <p style={{ color: "#3a3a3a", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
          By placing an order on egoffessentials.com, you agree to these terms.
        </p>

        <h2 style={{ fontSize: 18, color: "#006400", marginTop: 28, marginBottom: 10 }}>
          Orders & Payment
        </h2>
        <p style={{ color: "#3a3a3a", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
          All payments are processed securely through Square. Orders are confirmed once
          payment is successfully processed.
        </p>

        <h2 style={{ fontSize: 18, color: "#006400", marginTop: 28, marginBottom: 10 }}>
          Shipping
        </h2>
        <p style={{ color: "#3a3a3a", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
          Please allow standard processing and shipping time for your order. Shipping
          delays outside our control (carrier, weather) are not our responsibility, but
          we&apos;ll help however we can.
        </p>

        <h2 style={{ fontSize: 18, color: "#006400", marginTop: 28, marginBottom: 10 }}>
          Returns & Refunds
        </h2>
        <p style={{ color: "#8a6d3b", fontSize: 14, lineHeight: 1.7, marginBottom: 20, fontStyle: "italic" }}>
          [Placeholder — no return policy has been defined yet. Update this section
          before relying on it for a customer dispute.]
        </p>

        <h2 style={{ fontSize: 18, color: "#006400", marginTop: 28, marginBottom: 10 }}>
          Product Information
        </h2>
        <p style={{ color: "#3a3a3a", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
          We do our best to accurately describe our products. Natural/organic ingredients
          may vary slightly batch to batch.
        </p>

        <h2 style={{ fontSize: 18, color: "#006400", marginTop: 28, marginBottom: 10 }}>
          Contact Us
        </h2>
        <p style={{ color: "#3a3a3a", fontSize: 15, lineHeight: 1.7 }}>
          Email{" "}
          <a href="mailto:admin@egoffessentials.com" style={{ color: "#006400" }}>
            admin@egoffessentials.com
          </a>
          .
        </p>

        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: 32,
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
