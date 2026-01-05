// ===== API ROUTE: /api/credits/claim =====
// Verifies a Stripe checkout session and grants credits server-side.
//
// HOW IT WORKS:
// 1. Client calls GET with session_id after Stripe redirect.
// 2. We verify the session is paid with Stripe.
// 3. We grant credits to the current session in the ledger (idempotent).
// 4. We return the updated balance to the client.

import { NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/lib/stripe-server";
import { grantCredits } from "@/lib/credits-store";
import { attachSessionCookie, ensureSessionId } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    // ===== STEP 1: Ensure session =====
    const { sessionId, isNew } = ensureSessionId(request);

    // ===== STEP 2: Read checkout session ID =====
    const { searchParams } = new URL(request.url);
    const checkoutSessionId = searchParams.get("session_id");

    if (!checkoutSessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    // ===== STEP 3: Verify with Stripe =====
    const stripe = getServerStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ status: "pending", message: "Payment not yet confirmed" });
    }

    const credits = parseInt(session.metadata?.credits || "0", 10);
    if (credits <= 0) {
      return NextResponse.json({ error: "No credits found for this session" }, { status: 400 });
    }

    const metadataSessionId = session.metadata?.sessionId;
    if (metadataSessionId && metadataSessionId !== sessionId) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
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

    return response;
  } catch (error) {
    console.error("Claim GET error:", error);
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}
