"use client";

import { useState } from "react";

export default function SendPaymentLinkButton({
  orderId,
  status,
  notificationFailed,
}: {
  orderId: number;
  status: string;
  notificationFailed?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [markPaidLoading, setMarkPaidLoading] = useState(false);
  const [markPaidResult, setMarkPaidResult] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendResult, setResendResult] = useState<string | null>(null);
  const [resendDone, setResendDone] = useState(false);

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

  async function handleMarkPaid() {
    if (!window.confirm("Mark this order as paid? Use this once you've confirmed payment yourself — Zelle, cash, or anything outside Square.")) {
      return;
    }
    setMarkPaidLoading(true);
    setMarkPaidResult(null);
    try {
      const res = await fetch("/api/admin/orders/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMarkPaidResult("Marked paid!");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setMarkPaidResult(err instanceof Error ? err.message : "Failed");
    } finally {
      setMarkPaidLoading(false);
    }
  }

  async function handleResendNotification() {
    setResendLoading(true);
    setResendResult(null);
    try {
      const res = await fetch("/api/admin/orders/resend-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResendResult("Resent!");
      setResendDone(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setResendResult(err instanceof Error ? err.message : "Failed");
    } finally {
      setResendLoading(false);
    }
  }

  const resendButton = notificationFailed && !resendDone ? (
    <div className="flex flex-col items-start gap-1.5 mt-1.5">
      <button
        onClick={handleResendNotification}
        disabled={resendLoading}
        className="font-cinzel text-[10px] tracking-widest uppercase px-3.5 py-1.5 rounded-full transition-opacity"
        style={{
          background: "#fde8e8",
          color: "#b91c1c",
          border: "1px solid #f3c7c7",
          cursor: resendLoading ? "default" : "pointer",
          opacity: resendLoading ? 0.6 : 1,
        }}
      >
        {resendLoading ? "…" : "Resend Notification Email"}
      </button>
      {resendResult && (
        <div className="text-[11px]" style={{ color: "#8a8a8a" }}>
          {resendResult}
        </div>
      )}
    </div>
  ) : null;

  if (status === "paid") {
    return (
      <div className="flex flex-col items-start gap-1.5">
        <span className="text-xs" style={{ color: "#c0c0c0" }}>—</span>
        {resendButton}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
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
        <div className="text-[11px]" style={{ color: "#8a8a8a" }}>
          {result}
        </div>
      )}
      <button
        onClick={handleMarkPaid}
        disabled={markPaidLoading}
        className="font-cinzel text-[10px] tracking-widest uppercase px-3.5 py-1.5 rounded-full transition-opacity"
        style={{
          background: "transparent",
          color: "#0a2218",
          border: "1px solid #0a2218",
          cursor: markPaidLoading ? "default" : "pointer",
          opacity: markPaidLoading ? 0.6 : 1,
        }}
      >
        {markPaidLoading ? "…" : "Mark Paid (Zelle/Cash)"}
      </button>
      {markPaidResult && (
        <div className="text-[11px]" style={{ color: "#8a8a8a" }}>
          {markPaidResult}
        </div>
      )}
      {resendButton}
    </div>
  );
}
