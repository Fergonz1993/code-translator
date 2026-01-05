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
  // Pin API version to ensure consistent behavior across deployments
  // See: https://stripe.com/docs/api/versioning
  // Current stable version: 2024-11-20.acacia (update when Stripe releases new versions)
  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2024-11-20.acacia",
    appInfo: {
      name: "Code Translator",
      version: "0.1.0",
    },
  });

  return stripeInstance;
}
