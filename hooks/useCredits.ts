// ===== USE CREDITS HOOK =====
// Manages the user's credit balance via the server-side ledger.
// The balance is fetched from /api/credits/balance and cached in memory.

"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditsState, INITIAL_CREDITS } from "@/lib/types";

export function useCredits() {
  // ===== STATE =====
  const [credits, setCredits] = useState<CreditsState>({
    total: INITIAL_CREDITS,
    used: 0,
    remaining: INITIAL_CREDITS,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== LOAD BALANCE FROM SERVER =====
  const refreshCredits = useCallback(async () => {
    try {
      const response = await fetch("/api/credits/balance");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load credits");
      }

      if (data.credits) {
        setCredits(data.credits as CreditsState);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load credits");
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  // ===== UPDATE CREDITS FROM API RESPONSES =====
  const updateCredits = useCallback((next: CreditsState) => {
    setCredits(next);
    setIsLoaded(true);
  }, []);

  const hasCredits = credits.remaining > 0;

  return {
    credits,
    hasCredits,
    isLoaded,
    error,
    refreshCredits,
    updateCredits,
  };
}
