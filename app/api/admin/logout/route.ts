import { NextResponse } from "next/server";

export const runtime = "nodejs";

function clear(res: NextResponse) {
  res.cookies.set("egoff_admin", "", { path: "/", maxAge: 0 });
  return res;
}

export async function POST(req: Request) {
  return clear(NextResponse.json({ ok: true }));
}

export async function GET(req: Request) {
  return clear(NextResponse.redirect(new URL("/admin/login", req.url)));
}
