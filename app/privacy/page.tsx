import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | EGOFF Essentials",
  description: "EGOFF Essentials privacy policy — how we collect and protect your information.",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p style={{ color: "#a3a3a3", fontSize: 12, marginBottom: 28 }}>
          Last updated: September 2026
        </p>

        <p style={{ color: "#3a3a3a", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
          EGOFF Essentials ("we," "us") collects your name, email, shipping address, and
          payment information when you place an order or sign up for our newsletter.
          Payment is processed securely through Square — we never store your card details.
        </p>

        <h2 style={{ fontSize: 18, color: "#006400", marginTop: 28, marginBottom: 10 }}>
          How We Use Your Information
        </h2>
        <ul style={{ color: "#3a3a3a", fontSize: 15, lineHeight: 1.8, paddingLeft: 20, marginBottom: 20 }}>
          <li>To process and ship your order</li>
          <li>To send order confirmations and updates</li>
          <li>To send newsletter emails, if you&apos;ve subscribed (you can unsubscribe anytime)</li>
        </ul>

        <h2 style={{ fontSize: 18, color: "#006400", marginTop: 28, marginBottom: 10 }}>
          Information Sharing
        </h2>
        <p style={{ color: "#3a3a3a", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
          We don&apos;t sell or trade your information. We share it only with Square
          (payment processing) and our shipping carrier, or as required by law.
        </p>

        <h2 style={{ fontSize: 18, color: "#006400", marginTop: 28, marginBottom: 10 }}>
          Data Security
        </h2>
        <p style={{ color: "#3a3a3a", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
          Payment data is processed by Square and never touches our servers directly.
        </p>

        <h2 style={{ fontSize: 18, color: "#006400", marginTop: 28, marginBottom: 10 }}>
          Your Rights
        </h2>
        <p style={{ color: "#3a3a3a", fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>
          You can request access to, correction of, or deletion of your information, and
          unsubscribe from our newsletter at any time.
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
