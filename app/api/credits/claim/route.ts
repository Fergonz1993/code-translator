// ===== API ROUTE: /api/credits/claim =====
// Verifies a Stripe checkout session and grants credits server-side.
//
// HOW IT WORKS:
// 1. Client calls GET with session_id after Stripe redirect.
// 2. We verify the session is paid with Stripe.
// 3. We grant credits to the current session in the ledger (idempotent).
// 4. We return the updated balance to the client.

export const runtime = "nodejs";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/lib/stripe-server";
import { grantCredits } from "@/lib/credits-store";
import { attachSessionCookie, ensureSessionId } from "@/lib/session";
import { claimRequestSchema, parseRequest } from "@/lib/schemas";
import { createOriginErrorResponse, validateOrigin } from "@/lib/security";
import { createApiLogger } from "@/lib/api-logger";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const logApi = createApiLogger({
    route: "/api/credits/claim",
    method: request.method,
    requestId,
    startTime,
  });

  try {
    const originCheck = validateOrigin(request);
    if (!originCheck.valid) {
      const response = createOriginErrorResponse(originCheck.error || "Origin not allowed");
      logApi({ status: response.status, error: originCheck.error || "Origin not allowed" });
      return response;
    }

    // ===== STEP 1: Ensure session =====
    const { sessionId, isNew } = ensureSessionId(request);

    // ===== STEP 2: Read checkout session ID =====
    const { searchParams } = new URL(request.url);
    const rawSessionId = searchParams.get("session_id") ?? "";
    const parsed = parseRequest(claimRequestSchema, { checkoutSessionId: rawSessionId });

    if (!parsed.success) {
      const response = NextResponse.json({ error: parsed.error }, { status: 400 });
      logApi({ status: response.status, error: parsed.error });
      return response;
    }

    const checkoutSessionId = parsed.data.checkoutSessionId;

    // ===== STEP 3: Verify with Stripe =====
    const stripe = getServerStripe();
    if (!stripe) {
      const response = NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
      logApi({ status: response.status, error: "Stripe not configured" });
      return response;
    }

    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);

    if (session.payment_status !== "paid") {
      const response = NextResponse.json({ status: "pending", message: "Payment not yet confirmed" });
      logApi({ status: response.status, meta: { paymentStatus: session.payment_status } });
      return response;
    }

    const credits = parseInt(session.metadata?.credits || "0", 10);
    if (credits <= 0) {
      const response = NextResponse.json({ error: "No credits found for this session" }, { status: 400 });
      logApi({ status: response.status, error: "No credits found for this session" });
      return response;
    }

    const metadataSessionId = session.metadata?.sessionId;
    if (metadataSessionId && metadataSessionId !== sessionId) {
      const response = NextResponse.json({ error: "Session mismatch" }, { status: 403 });
      logApi({ status: response.status, error: "Session mismatch" });
      return response;
    }

    // ===== STEP 4: Grant credits (idempotent) =====
    const balance = grantCredits({
      sessionId,
      amount: credits,
      source: "stripe",
      idempotencyKey: `stripe:${session.id}`,
    });

    const response = NextResponse.json({
      status: "success",
      creditsAdded: credits,
      balance,
    });

    if (isNew) {
      attachSessionCookie(response, sessionId);
    }

    logApi({ status: response.status });
    return response;
  } catch (error) {
    console.error("Claim GET error:", error);
    const response = NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
    logApi({ status: response.status, error: "Failed to verify session" });
    return response;
  }
}
