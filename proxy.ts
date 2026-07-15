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

  if (!expected || !safeEq(cookie, expected)) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
