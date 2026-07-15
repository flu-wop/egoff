import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { safeEq, sessionToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

function getIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: Request) {
  const ip = getIp(req);
  const allowed = await rateLimit(`admin-login:${ip}`, 5, 15 * 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const password = body.password || "";
  const expected = process.env.ADMIN_PASSWORD || "";

  if (!expected || !safeEq(password, expected)) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("egoff_admin", sessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 8 * 60 * 60, // 8 hours
    path: "/",
  });
  return res;
}
