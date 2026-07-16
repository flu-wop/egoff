import { NextResponse, type NextRequest } from "next/server";
import { sessionToken, safeEq } from "@/lib/admin-auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login page and the login/logout API routes must stay reachable.
  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("egoff_admin")?.value || "";
  const expected = sessionToken();
  const authed = !!expected && safeEq(cookie, expected);

  if (!authed) {
    // API routes need a clean JSON 401 — redirecting to an HTML login page
    // breaks fetch().json() on the client. Page routes redirect normally.
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
