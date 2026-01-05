// ===== STRIPE SERVER UTILITY =====
// Server-side Stripe initialization and singleton
// This ensures we only create one Stripe instance and share it across the app.

import Stripe from "stripe";

// ===== SINGLETON INSTANCE =====
let stripeInstance: Stripe | null = null;

/**
 * Gets the Stripe server-side instance.
 * Returns null if STRIPE_SECRET_KEY is missing.
 */
export function getServerStripe(): Stripe | null {
  // Return cached instance if it exists
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    console.warn("STRIPE_SECRET_KEY is not configured in environment variables.");
    return null;
  }

  // Initialize and cache the instance
  // Note: We don't specify apiVersion - SDK uses its bundled default version
  // This avoids TypeScript errors when Stripe updates their types
  stripeInstance = new Stripe(secretKey, {
    appInfo: {
      name: "Code Translator",
      version: "0.1.0",
    },
  });

  return stripeInstance;
}
