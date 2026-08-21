import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { safeEq, sessionToken } from "@/lib/admin-auth";
import {
  checkEnvVars,
  checkSquare,
  checkLastOrderWebhook,
  checkResend,
  checkTurso,
  checkApiUsage,
} from "@/lib/health-checks";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("egoff_admin")?.value || "";
  if (!process.env.ADMIN_PASSWORD || !safeEq(session, sessionToken())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [envVars, square, lastOrder, resend, turso, apiUsage] = await Promise.all([
    Promise.resolve(checkEnvVars()),
    checkSquare(),
    checkLastOrderWebhook(),
    checkResend(),
    checkTurso(),
    checkApiUsage(),
  ]);

  return NextResponse.json({
    envVars,
    webhookHealth: { square, lastOrder, resend, turso },
    apiUsage,
    checkedAt: new Date().toISOString(),
  });
}
