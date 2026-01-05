// ===== BUY CREDITS MODAL =====
// Modal that shows credit packages and handles Stripe checkout
//
// HOW IT WORKS:
// 1. User clicks "Buy more" in credits display
// 2. This modal opens showing available packages
// 3. User selects a package
// 4. We call /api/checkout to create a Stripe session
// 5. User is redirected to Stripe's checkout page
// 6. After payment, they return to the app with credits added

"use client";

import { useState } from "react";
import { CREDIT_PACKAGES, formatPrice, pricePerCredit } from "@/lib/stripe";

// ===== COMPONENT PROPS =====

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsAdded: (credits: number) => void;
}

// ===== THE COMPONENT =====

export function BuyCreditsModal({
  isOpen,
  onClose,
  onCreditsAdded: _onCreditsAdded, // Prefixed with _ - credits are added via URL redirect
}: BuyCreditsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== HANDLE PACKAGE SELECTION =====

  async function handlePurchase(packageId: string) {
    setIsLoading(true);
    setError(null);

    try {
      // Call our API to create a Stripe checkout session
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  }

  // ===== DON'T RENDER IF NOT OPEN =====

  if (!isOpen) return null;

  return (
    // ===== BACKDROP =====
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* ===== MODAL CONTENT ===== */}
      <div
        className="bg-slate-800 rounded-lg max-w-md w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Buy Credits</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ===== ERROR MESSAGE ===== */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* ===== CREDIT PACKAGES ===== */}
        <div className="space-y-3 mb-6">
          {CREDIT_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handlePurchase(pkg.id)}
              disabled={isLoading}
              className={`
                w-full p-4 rounded-lg border-2 transition-all text-left
                ${
                  pkg.popular
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-600 hover:border-slate-500"
                }
                ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-700/50"}
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-white">
                      {pkg.credits} credits
                    </span>
                    {pkg.popular && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        Best value
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-slate-400">
                    {pricePerCredit(pkg)}
                  </span>
                </div>
                <span className="text-xl font-bold text-white">
                  {formatPrice(pkg.price)}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* ===== FOOTER INFO ===== */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            Secure payment powered by Stripe
          </p>
          <p className="text-xs text-slate-500 mt-1">
            1 credit = 1 translation
          </p>
        </div>

        {/* ===== LOADING OVERLAY ===== */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-3 text-white">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Redirecting to checkout...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
