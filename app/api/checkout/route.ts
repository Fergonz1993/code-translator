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

export const runtime = "nodejs";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerStripe } from "@/lib/stripe-server";
import { CREDIT_PACKAGES } from "@/lib/stripe";
import { getCreditsBalance } from "@/lib/credits-store";
import { attachSessionCookie, ensureSessionId } from "@/lib/session";
import { checkoutRequestSchema, parseRequest } from "@/lib/schemas";
import { createOriginErrorResponse, validateOrigin } from "@/lib/security";
import { createApiLogger } from "@/lib/api-logger";

// ===== CREATE CHECKOUT SESSION =====

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const logApi = createApiLogger({
    route: "/api/checkout",
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

    // ===== STEP 0: Ensure session =====
    const { sessionId, isNew } = ensureSessionId(request);
    if (isNew) {
      // Initialize credits for new sessions
      getCreditsBalance(sessionId);
    }

    // ===== STEP 1: Get Stripe instance =====
    const stripe = getServerStripe();
    if (!stripe) {
      const response = NextResponse.json(
        {
          error:
            "Payment system not configured. Please use your own API key instead.",
        },
        { status: 503 }
      );
      logApi({ status: response.status, error: "Stripe not configured" });
      return response;
    }

    // ===== STEP 2: Parse and validate request =====
    const rawBody = await request.json();
    const parsed = parseRequest(checkoutRequestSchema, rawBody);

    if (!parsed.success) {
      const response = NextResponse.json(
        { error: parsed.error },
        { status: 400 }
      );
      logApi({ status: response.status, error: parsed.error });
      return response;
    }

    const { packageId } = parsed.data;

    // ===== STEP 3: Find the package =====
    const creditPackage = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!creditPackage) {
      const response = NextResponse.json(
        { error: "Invalid package" },
        { status: 400 }
      );
      logApi({ status: response.status, error: "Invalid package" });
      return response;
    }

    // ===== STEP 4: Create Checkout Session =====
    // SECURITY: Use APP_URL from env instead of client-controllable origin header
    const appUrl = process.env.APP_URL || (
      process.env.NODE_ENV === "production"
        ? undefined // Fail in production if APP_URL not set
        : "http://localhost:3000"
    );

    if (!appUrl) {
      console.error("APP_URL environment variable is not set in production");
      const response = NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
      logApi({ status: response.status, error: "APP_URL not set" });
      return response;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: sessionId,
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
      // This is verified server-side via Stripe webhook metadata
      metadata: {
        credits: creditPackage.credits.toString(),
        packageId: creditPackage.id,
        sessionId,
      },
      // ===== REDIRECT URLS =====
      // We removed &credits=... to prevent client-side URL spoofing.
      // Credits are now granted via server-side webhook and a signed-token claim flow.
      success_url: `${appUrl}?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}?purchase=cancelled`,
    });

    // ===== STEP 5: Return session URL =====
    const response = NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });

    if (isNew) {
      attachSessionCookie(response, sessionId);
    }

    logApi({ status: response.status });
    return response;
  } catch (error) {
    console.error("Checkout error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to create checkout";

    const response = NextResponse.json({ error: message }, { status: 500 });
    logApi({ status: response.status, error: message });
    return response;
  }
}
