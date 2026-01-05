// ===== API ROUTE: /api/credits/claim =====
// Securely grants credits to users after a successful Stripe payment.
//
// HOW IT WORKS:
// 1. Client calls GET with sessionId.
// 2. We verify with Stripe that the session is "paid".
// 3. We return a short-lived signed token containing credit info.
// 4. Client calls POST with the token.
// 5. We validate the signature and return the credits.
//
// This multi-step flow ensures that credits cannot be spoofed by 
// editing URL parameters, and provides a layer of security for the MVP.

import { NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/lib/stripe-server";
import { generateCreditToken, validateCreditToken } from "@/lib/tokens";

// ===== CLAIMED SESSIONS (MVP ONLY - NOT PRODUCTION READY) =====
// 
// WARNING: This in-memory Set has critical limitations:
// 1. Lost on server restart (sessions can be re-claimed)
// 2. No cross-instance visibility (race conditions in multi-instance deployments)
// 3. No persistence (cannot survive crashes or deployments)
// 
// PRODUCTION REQUIREMENTS:
// - Use Redis with SETNX (SET if Not eXists) for atomic distributed locks
//   Example: SETNX session:claim:{sessionId} 1 EX 3600
// - OR use your primary database with:
//   - A "credit_claims" table with session_id (unique constraint)
//   - A transaction with atomic UPDATE ... WHERE claimed_at IS NULL
//   - Proper indexing and retry logic for contention
// 
// This Set should be replaced before deploying to production.
const claimedSessions = new Set<string>();

/**
 * GET: Check session status and issue a signed token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const stripe = getServerStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    // Retrieve the session from Stripe to verify payment status
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ status: "pending", message: "Payment not yet confirmed" });
    }

    // Check if already claimed (in-memory only for MVP)
    if (claimedSessions.has(sessionId)) {
      return NextResponse.json({ error: "Credits already claimed for this session" }, { status: 400 });
    }

    const credits = parseInt(session.metadata?.credits || "0", 10);
    if (credits <= 0) {
      return NextResponse.json({ error: "No credits found for this session" }, { status: 400 });
    }

    // Generate a signed token
    const token = generateCreditToken(sessionId, credits);

    return NextResponse.json({ status: "success", token });
  } catch (error) {
    console.error("Claim GET error:", error);
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}

/**
 * POST: Validate token and award credits
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // Validate the token signature and expiry
    const decoded = validateCreditToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Final check for double-claiming
    if (claimedSessions.has(decoded.sessionId)) {
      return NextResponse.json({ error: "Credits already claimed" }, { status: 400 });
    }

    // Record as claimed
    claimedSessions.add(decoded.sessionId);

    console.log(`✅ Credits claimed: ${decoded.credits} for session ${decoded.sessionId}`);

    return NextResponse.json({ 
      success: true, 
      credits: decoded.credits 
    });
  } catch (error) {
    console.error("Claim POST error:", error);
    return NextResponse.json({ error: "Failed to claim credits" }, { status: 500 });
  }
}
