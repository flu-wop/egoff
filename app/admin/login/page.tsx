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
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAF8F2",
        fontFamily: "Georgia, serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          border: "1px solid #e5e0d5",
          padding: 40,
          width: 320,
        }}
      >
        <div style={{ color: "#006400", fontSize: 20, fontWeight: "bold", marginBottom: 4 }}>
          EGOFF ESSENTIALS
        </div>
        <div style={{ color: "#6b6b6b", fontSize: 12, letterSpacing: 1, marginBottom: 24 }}>
          ADMIN
        </div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 10,
            border: "1px solid #ccc",
            marginBottom: 12,
            fontSize: 14,
            boxSizing: "border-box",
          }}
        />
        {error && (
          <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 10,
            background: "#006400",
            color: "#F4C430",
            border: "none",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Checking..." : "Log In"}
        </button>
      </form>
    </div>
  );
}
