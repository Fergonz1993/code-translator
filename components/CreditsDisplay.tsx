// ===== CREDITS DISPLAY COMPONENT =====
// Shows the user's credit balance and a button to buy more.
// Only shown when user is in "credits" payment mode.

"use client";

import { CreditsState } from "@/lib/types";

interface CreditsDisplayProps {
  credits: CreditsState;
  onBuyMore: () => void;
}

export function CreditsDisplay({ credits, onBuyMore }: CreditsDisplayProps) {
  // Calculate percentage for progress bar
  const percentage = credits.total > 0
    ? (credits.remaining / credits.total) * 100
    : 0;

  // Determine color based on remaining credits
  const getColor = () => {
    if (credits.remaining <= 3) return "bg-red-500";
    if (credits.remaining <= 10) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="flex items-center gap-3">
      {/* Credits count */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Credits:</span>
        <span
          className={`
            text-sm font-medium
            ${credits.remaining <= 3 ? "text-red-400" : "text-white"}
          `}
        >
          {credits.remaining}
        </span>

        {/* Mini progress bar */}
        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Buy more button (only show when low) */}
      {credits.remaining <= 10 && (
        <button
          onClick={onBuyMore}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Get more
        </button>
      )}

      {/* Out of credits warning */}
      {credits.remaining === 0 && (
        <span className="text-xs text-red-400">
          Out of credits!
        </span>
      )}
    </div>
  );
}
