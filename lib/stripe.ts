// ===== STRIPE CONFIGURATION =====
// Client-side Stripe setup for Code Translator

import { loadStripe, Stripe } from "@stripe/stripe-js";

// ===== CREDIT PACKAGES =====
// Different credit bundles users can purchase

export interface CreditPackage {
  id: string;
  credits: number;
  price: number; // in cents (USD)
  popular?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "credits_50",
    credits: 50,
    price: 499, // $4.99
  },
  {
    id: "credits_150",
    credits: 150,
    price: 999, // $9.99
    popular: true, // Best value
  },
  {
    id: "credits_500",
    credits: 500,
    price: 2499, // $24.99
  },
];

// ===== STRIPE INSTANCE =====
// Singleton pattern - only load Stripe once

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.warn("Stripe publishable key not configured");
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

// ===== FORMAT PRICE =====
// Convert cents to display price

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ===== PRICE PER CREDIT =====
// Calculate price per credit for display

export function pricePerCredit(pkg: CreditPackage): string {
  const perCredit = pkg.price / pkg.credits;
  return `$${perCredit.toFixed(2)}/credit`;
}
