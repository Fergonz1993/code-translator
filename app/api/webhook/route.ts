// ===== API ROUTE: /api/webhook =====
// Stripe webhook handler for processing successful payments.
// Credits are granted server-side via the ledger with idempotency.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerStripe } from "@/lib/stripe-server";
import { grantCredits } from "@/lib/credits-store";

export async function POST(request: NextRequest) {
  try {
    const stripe = getServerStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 503 }
      );
    }

    // ===== STEP 1: Get raw body and signature =====
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

        if (session.payment_status !== "paid") {
          console.log(
            `Session ${session.id} not paid yet (status: ${session.payment_status})`
          );
          break;
        }

        const credits = parseInt(session.metadata?.credits || "0", 10);
        const sessionId = session.metadata?.sessionId;

        if (!sessionId) {
          console.error(`No sessionId found in metadata for session ${session.id}`);
          break;
        }

        if (!credits || credits <= 0) {
          console.error(`No credits found in metadata for session ${session.id}`);
          break;
        }

        grantCredits({
          sessionId,
          amount: credits,
          source: "stripe_webhook",
          idempotencyKey: `stripe:${session.id}`,
        });

        console.log(
          `Payment verified: ${credits} credits granted for session ${session.id}`
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
