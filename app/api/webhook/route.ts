// ===== API ROUTE: /api/webhook =====
// Stripe webhook handler for processing successful payments
//
// HOW IT WORKS:
// 1. User completes payment on Stripe's checkout page
// 2. Stripe sends a webhook event to this endpoint
// 3. We verify the signature to ensure it's from Stripe
// 4. We extract the credits from the session metadata
// 5. We return success (credits are added client-side via URL params)
//
// NOTE: In a production app with user accounts, you would:
// - Store user ID in the checkout session metadata
// - Update the user's credit balance in your database
// - Send a confirmation email
//
// For this MVP (no auth, localStorage), credits are added client-side
// when the user is redirected to ?purchase=success&credits=X

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// ===== INITIALIZE STRIPE =====

function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey);
}

// ===== WEBHOOK HANDLER =====

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
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

        // Extract credits from metadata
        const credits = session.metadata?.credits;
        const packageId = session.metadata?.packageId;

        console.log(
          `Payment successful: ${credits} credits purchased (package: ${packageId})`
        );

        // In a real app with user accounts, you would:
        // 1. Get user ID from session.metadata or session.customer_email
        // 2. Update user's credit balance in database
        // 3. Send confirmation email
        //
        // For this MVP, credits are added client-side via URL params

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error(`Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        // Unhandled event type - log but don't error
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
