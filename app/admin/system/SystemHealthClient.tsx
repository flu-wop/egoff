"use client";

import { useState, useEffect, useCallback } from "react";

type CheckResult = { status: "ok" | "warn" | "error"; detail: string };
type HealthData = {
  envVars: Record<string, CheckResult>;
  webhookHealth: { square: CheckResult; lastOrder: CheckResult; resend: CheckResult; turso: CheckResult };
  apiUsage: CheckResult;
  checkedAt: string;
};

const STATUS_COLOR: Record<CheckResult["status"], string> = {
  ok: "#006400",
  warn: "#F4C430",
  error: "#b91c1c",
};

function Pill({ status }: { status: CheckResult["status"] }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 9,
        height: 9,
        borderRadius: "50%",
        background: STATUS_COLOR[status],
        marginRight: 8,
        flexShrink: 0,
      }}
    />
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e0d5",
        borderRadius: 8,
        padding: 20,
      }}
    >
      <h3 style={{ fontSize: 15, fontWeight: "bold", color: "#006400", marginBottom: 12, letterSpacing: 0.5 }}>
        {title.toUpperCase()}
      </h3>
      {children}
    </div>
  );
}

const LABELS: Record<string, string> = {
  square: "Square",
  lastOrder: "Last Order",
  resend: "Resend",
  turso: "Turso",
};

export default function SystemHealthClient() {
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState("");

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/health");
      if (!res.ok) {
        setError("Session expired — refresh to log in again.");
        return;
      }
      setData(await res.json());
      setError("");
    } catch {
      setError("Health check request failed.");
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 60_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <div style={{ padding: 32 }}>
      {error && (
        <p style={{ color: "#b91c1c", fontSize: 13, marginBottom: 16 }}>{error}</p>
      )}
      {!data && !error && <p style={{ color: "#6b6b6b" }}>Loading…</p>}
      {data && (
        <>
          <p style={{ color: "#6b6b6b", fontSize: 12, marginBottom: 20 }}>
            Last checked {new Date(data.checkedAt).toLocaleTimeString()} — refreshes every 60s
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            <Card title="Env Vars">
              {Object.entries(data.envVars).map(([key, r]) => (
                <div key={key} style={{ marginBottom: 6, fontSize: 13, display: "flex", alignItems: "center" }}>
                  <Pill status={r.status} /> {key} — {r.detail}
                </div>
              ))}
            </Card>

            <Card title="Webhook Health">
              {Object.entries(data.webhookHealth).map(([key, r]) => (
                <div key={key} style={{ marginBottom: 6, fontSize: 13, display: "flex", alignItems: "center" }}>
                  <Pill status={r.status} /> {LABELS[key] || key} — {r.detail}
                </div>
              ))}
            </Card>

            <Card title="Order Volume (30d)">
              <div style={{ fontSize: 13, display: "flex", alignItems: "center" }}>
                <Pill status={data.apiUsage.status} /> {data.apiUsage.detail}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
