// ===== API ROUTE: /api/checkout =====
// Creates a Stripe Checkout session for purchasing credits
//
// HOW IT WORKS:
// 1. User clicks "Buy credits" and selects a package
// 2. Frontend calls this endpoint with the package ID
// 3. We create a Stripe Checkout session
// 4. User is redirected to Stripe's hosted checkout page
// 5. After payment, Stripe redirects back to our success/cancel URLs
// 6. Webhook (separate endpoint) handles adding credits to user

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { CREDIT_PACKAGES } from "@/lib/stripe";

// ===== INITIALIZE STRIPE =====
// Only initialize if we have a secret key

function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey);
}

// ===== CREATE CHECKOUT SESSION =====

export async function POST(request: NextRequest) {
  try {
    // ===== STEP 1: Get Stripe instance =====
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        {
          error:
            "Payment system not configured. Please use your own API key instead.",
        },
        { status: 503 }
      );
    }

    // ===== STEP 2: Parse request =====
    const body = await request.json();
    const { packageId } = body as { packageId: string };

    if (!packageId) {
      return NextResponse.json(
        { error: "Missing packageId" },
        { status: 400 }
      );
    }

    // ===== STEP 3: Find the package =====
    const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!creditPackage) {
      return NextResponse.json(
        { error: "Invalid package" },
        { status: 400 }
      );
    }

    // ===== STEP 4: Create Checkout Session =====
    const origin = request.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${creditPackage.credits} Translation Credits`,
              description: `Add ${creditPackage.credits} credits to your Code Translator balance`,
            },
            unit_amount: creditPackage.price,
          },
          quantity: 1,
        },
      ],
      // ===== METADATA =====
      // We store the credits here so the webhook knows how many to add
      metadata: {
        credits: creditPackage.credits.toString(),
        packageId: creditPackage.id,
      },
      // ===== REDIRECT URLS =====
      success_url: `${origin}?purchase=success&credits=${creditPackage.credits}`,
      cancel_url: `${origin}?purchase=cancelled`,
    });

    // ===== STEP 5: Return session URL =====
    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Checkout error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create checkout";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
