"use client";

import { useState, useEffect, useCallback } from "react";

type CheckResult = { status: "ok" | "warn" | "error"; detail: string };
type HealthData = {
  envVars: Record<string, CheckResult>;
  webhookHealth: { square: CheckResult; lastOrder: CheckResult; resend: CheckResult; turso: CheckResult };
  apiUsage: CheckResult;
  failedNotifications: CheckResult;
  checkedAt: string;
};

const STATUS_COLOR: Record<CheckResult["status"], string> = {
  ok: "#0a7a3e",
  warn: "#b7791f",
  error: "#b91c1c",
};

const STATUS_BG: Record<CheckResult["status"], string> = {
  ok: "#e8f5ec",
  warn: "#fdf3dd",
  error: "#fde8e8",
};

function Pill({ status }: { status: CheckResult["status"] }) {
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{ width: 8, height: 8, background: STATUS_COLOR[status], marginTop: 4, marginRight: 10 }}
    />
  );
}

function Card({
  title,
  status,
  children,
}: {
  title: string;
  status?: CheckResult["status"];
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        background: "#fff",
        border: status ? `1px solid ${STATUS_COLOR[status]}33` : "1px solid #e5e0d5",
      }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="font-cinzel text-[11px] tracking-widest uppercase" style={{ color: "#0a2218" }}>
          {title}
        </h3>
        {status && (
          <span
            className="text-[10px] font-cinzel tracking-widest uppercase px-2 py-1 rounded-full"
            style={{ background: STATUS_BG[status], color: STATUS_COLOR[status] }}
          >
            {status}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function CheckRow({ label, result }: { label: string; result: CheckResult }) {
  return (
    <div className="flex items-start mb-2.5 last:mb-0">
      <Pill status={result.status} />
      <div>
        <span className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
          {label}
        </span>
        <p className="text-xs mt-0.5" style={{ color: "#8a8a8a" }}>
          {result.detail}
        </p>
      </div>
    </div>
  );
}

const WEBHOOK_LABELS: Record<string, string> = {
  square: "Square",
  lastOrder: "Last Order",
  resend: "Resend",
  turso: "Turso",
};

function SkeletonCard() {
  return (
    <div className="rounded-lg p-5 animate-pulse" style={{ background: "#fff", border: "1px solid #e5e0d5" }}>
      <div className="h-3 w-24 rounded mb-4" style={{ background: "#eee2c8" }} />
      <div className="h-2.5 w-full rounded mb-2" style={{ background: "#f0ece0" }} />
      <div className="h-2.5 w-4/5 rounded mb-2" style={{ background: "#f0ece0" }} />
      <div className="h-2.5 w-3/5 rounded" style={{ background: "#f0ece0" }} />
    </div>
  );
}

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

  const envIssues = data ? Object.values(data.envVars).filter((r) => r.status !== "ok").length : 0;
  const overallStatus: CheckResult["status"] | null = data
    ? [
        ...Object.values(data.envVars),
        data.webhookHealth.square,
        data.webhookHealth.resend,
        data.webhookHealth.turso,
        data.failedNotifications,
      ].some((r) => r.status === "error")
      ? "error"
      : [
            ...Object.values(data.envVars),
            data.webhookHealth.square,
            data.webhookHealth.resend,
            data.webhookHealth.turso,
            data.failedNotifications,
          ].some((r) => r.status === "warn")
        ? "warn"
        : "ok"
    : null;

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
      {error && (
        <div
          className="rounded-lg px-4 py-3 mb-6 text-sm"
          style={{ background: "#fde8e8", color: "#b91c1c" }}
        >
          {error}
        </div>
      )}

      {!data && !error && (
        <>
          <div className="h-4 w-64 rounded mb-6 animate-pulse" style={{ background: "#f0ece0" }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </>
      )}

      {data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <p className="text-xs" style={{ color: "#8a8a8a" }}>
              Last checked {new Date(data.checkedAt).toLocaleTimeString()} · refreshes every 60s
            </p>
            {overallStatus && (
              <span
                className="font-cinzel text-[11px] tracking-widest uppercase px-3 py-1.5 rounded-full"
                style={{ background: STATUS_BG[overallStatus], color: STATUS_COLOR[overallStatus] }}
              >
                {overallStatus === "ok" ? "All Systems Go" : overallStatus === "warn" ? "Needs Attention" : "Action Needed"}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Card
              title={`Environment Variables${envIssues > 0 ? ` (${envIssues} issue${envIssues > 1 ? "s" : ""})` : ""}`}
              status={envIssues > 0 ? "error" : "ok"}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6">
                {Object.entries(data.envVars).map(([key, r]) => (
                  <CheckRow key={key} label={key} result={r} />
                ))}
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card title="Webhook & Connectivity">
                {Object.entries(data.webhookHealth).map(([key, r]) => (
                  <CheckRow key={key} label={WEBHOOK_LABELS[key] || key} result={r} />
                ))}
              </Card>

              <Card title="Order Volume (30 days)" status={data.apiUsage.status}>
                <p className="text-sm" style={{ color: "#4a4a4a" }}>
                  {data.apiUsage.detail}
                </p>
              </Card>

              <Card title="Order Notifications" status={data.failedNotifications.status}>
                <p className="text-sm" style={{ color: "#4a4a4a" }}>
                  {data.failedNotifications.detail}
                </p>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
