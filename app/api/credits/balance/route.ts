// ===== API ROUTE: /api/credits/balance =====
// Returns the current credit balance for the active session.

import { NextRequest, NextResponse } from "next/server";
import { getCreditsBalance } from "@/lib/credits-store";
import { attachSessionCookie, ensureSessionId } from "@/lib/session";

export async function GET(request: NextRequest) {
  const { sessionId, isNew } = ensureSessionId(request);
  const credits = getCreditsBalance(sessionId);

  const response = NextResponse.json({ credits });
  if (isNew) {
    attachSessionCookie(response, sessionId);
  }

  return response;
}
