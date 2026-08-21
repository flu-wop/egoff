import { NextResponse } from "next/server";
import {
  checkEnvVars,
  checkSquare,
  checkLastOrderWebhook,
  checkResend,
  checkTurso,
  checkApiUsage,
} from "@/lib/health-checks";

export const runtime = "nodejs";

// Auth is enforced by proxy.ts (matcher covers /api/admin/:path*).
export async function GET() {
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
