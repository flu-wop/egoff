import { timingSafeEqual, createHmac } from "crypto";

export function safeEq(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

// Cookie holds this derived token, never the raw password — so a leaked
// cookie (log line, XSS despite httpOnly, browser history) never discloses
// the actual admin password.
export function sessionToken(): string {
  return createHmac("sha256", process.env.ADMIN_PASSWORD || "")
    .update("egoff-admin-session")
    .digest("hex");
}
