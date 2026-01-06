// ===== API ROUTE: /api/credits/balance =====
// Returns the current credit balance for the active session.

export const runtime = "nodejs";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCreditsBalance } from "@/lib/credits-store";
import { attachSessionCookie, ensureSessionId } from "@/lib/session";
import { createApiLogger } from "@/lib/api-logger";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const logApi = createApiLogger({
    route: "/api/credits/balance",
    method: request.method,
    requestId,
    startTime,
  });

  const { sessionId, isNew } = ensureSessionId(request);
  const credits = getCreditsBalance(sessionId);

  const response = NextResponse.json({ credits });
  if (isNew) {
    attachSessionCookie(response, sessionId);
  }

  logApi({ status: response.status });
  return response;
}
