// ===== API ROUTE: /api/webhook =====
// Stripe webhook handler for processing successful payments
//
// SECURITY WARNING:
// -----------------
// CRITICAL: Previously, this app relied on client-side URL parameters (?credits=X) 
// to grant credits. This is EXTREMELY INSECURE as users can manually edit the URL 
// to gain infinite credits.
//
// FIXED: We now use this server-side webhook to verify payments. 
// Credits are only granted after Stripe confirms the payment is "paid".
// We use a signed-token flow to securely transfer credit info to the client.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerStripe } from "@/lib/stripe-server";

// ===== IN-MEMORY SESSION STORE (MVP ONLY) =====
// In a production app, use Redis or a Database (PostgreSQL/MongoDB)
// to track processed sessions and prevent double-claiming.
// 
// WARNING: This Map grows unbounded and is lost on restart.
// For production, use Redis (with TTL) or a database with proper indexing.
const processedSessions = new Map<string, number>(); // sessionId -> timestamp

// TTL for session entries (24 hours)
const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

/**
 * Removes expired entries from the processed sessions map.
 * Call this before processing each request to prevent unbounded growth.
 */
function cleanupOldSessions() {
  const now = Date.now();
  for (const [sessionId, timestamp] of processedSessions.entries()) {
    if (now - timestamp > SESSION_TTL_MS) {
      processedSessions.delete(sessionId);
    }
  }
}

// ===== WEBHOOK HANDLER =====

export async function POST(request: NextRequest) {
  try {
    // Clean up expired sessions before processing
    cleanupOldSessions();
    
    const stripe = getServerStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 503 }
      );
    }

    // ===== STEP 1: Get the raw body and signature =====
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // ===== STEP 2: Verify webhook signature =====
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 503 }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // ===== STEP 3: Handle the event =====
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Verify payment status
        if (session.payment_status !== "paid") {
          console.log(`Session ${session.id} not paid yet (status: ${session.payment_status})`);
          break;
        }

        // Prevent duplicate processing
        if (processedSessions.has(session.id)) {
          console.log(`Session ${session.id} already processed`);
          break;
        }

        // Extract credits from verified metadata
        const credits = session.metadata?.credits;
        const _packageId = session.metadata?.packageId; // Prefixed - for future logging/analytics

        if (!credits) {
          console.error(`No credits found in metadata for session ${session.id}`);
          break;
        }

        console.log(
          `✅ PAYMENT VERIFIED: ${credits} credits for session ${session.id}`
        );

        // Record the session as processed with current timestamp
        processedSessions.set(session.id, Date.now());

        // NOTE: In a production app, you would update your database here.
        // For this MVP, we've implemented a signed-token flow.
        // The client will poll an endpoint to get a signed token for this session.
        
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`❌ Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // ===== STEP 4: Return success =====
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
