// ===== API ROUTE: /api/webhook =====
// Stripe webhook handler for processing successful payments.
// Credits are granted server-side via the ledger with idempotency.

export const runtime = "nodejs";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerStripe } from "@/lib/stripe-server";
import { grantCredits } from "@/lib/credits-store";
import { createApiLogger } from "@/lib/api-logger";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const logApi = createApiLogger({
    route: "/api/webhook",
    method: request.method,
    requestId,
    startTime,
  });

  try {
    const stripe = getServerStripe();
    if (!stripe) {
      const response = NextResponse.json(
        { error: "Stripe not configured" },
        { status: 503 }
      );
      logApi({ status: response.status, error: "Stripe not configured" });
      return response;
    }

    // ===== STEP 1: Get raw body and signature =====
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      const response = NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
      logApi({ status: response.status, error: "Missing signature" });
      return response;
    }

    // ===== STEP 2: Verify webhook signature =====
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      const response = NextResponse.json(
        { error: "Webhook not configured" },
        { status: 503 }
      );
      logApi({ status: response.status, error: "STRIPE_WEBHOOK_SECRET not configured" });
      return response;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch {
      const response = NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
      logApi({ status: response.status, error: "Invalid signature" });
      return response;
    }

    // ===== STEP 3: Handle the event =====
    // Avoid logging sensitive Stripe IDs (session/payment_intent IDs).
    const eventType = event.type;
    let outcome: string = "ignored";
    let creditsGranted: number | null = null;
    let paymentStatus: string | null = null;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        paymentStatus = session.payment_status;

        if (session.payment_status !== "paid") {
          outcome = "checkout_not_paid";
          break;
        }

        const credits = parseInt(session.metadata?.credits || "0", 10);
        const sessionId = session.metadata?.sessionId;

        if (!sessionId) {
          outcome = "missing_session_id";
          break;
        }

        if (!credits || credits <= 0) {
          outcome = "missing_credits";
          break;
        }

        grantCredits({
          sessionId,
          amount: credits,
          source: "stripe_webhook",
          idempotencyKey: `stripe:${session.id}`,
        });

        outcome = "credits_granted";
        creditsGranted = credits;
        break;
      }

      case "payment_intent.payment_failed": {
        outcome = "payment_failed";
        break;
      }

      default: {
        outcome = "unhandled_event";
      }
    }

    const response = NextResponse.json({ received: true });
    logApi({
      status: response.status,
      meta: {
        eventType,
        outcome,
        creditsGranted,
        paymentStatus,
      },
    });
    return response;
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "unknown";
    const response = NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
    logApi({ status: response.status, error: "Webhook handler failed", meta: { errorName } });
    return response;
  }
}
