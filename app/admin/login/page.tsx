"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/admin/orders";
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: "linear-gradient(135deg, #022c22 0%, #0a2218 100%)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="rounded-lg p-10 w-full"
        style={{ background: "#fffdf7", maxWidth: 360, border: "1px solid rgba(183,121,31,0.3)" }}
      >
        <p className="font-cinzel text-sm tracking-[0.2em] mb-1" style={{ color: "#b7791f" }}>
          EGOFF <span style={{ color: "#0a2218" }}>ESSENTIALS</span>
        </p>
        <p className="font-lato text-[11px] tracking-widest mb-8" style={{ color: "#9a9a9a" }}>
          ADMIN LOGIN
        </p>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          className="w-full rounded-md px-3.5 py-2.5 text-sm mb-3 outline-none transition-colors"
          style={{ border: "1px solid #e5e0d5", background: "#fff" }}
        />

        {error && (
          <div
            className="rounded-md px-3 py-2 text-xs mb-3"
            style={{ background: "#fde8e8", color: "#b91c1c" }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full font-cinzel text-xs tracking-widest uppercase py-3 transition-opacity"
          style={{
            background: "#b7791f",
            color: "#fffdf7",
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Checking…" : "Log In"}
        </button>
      </form>
    </div>
  );
}
