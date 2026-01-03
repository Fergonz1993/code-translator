// ===== USE CREDITS HOOK =====
// Manages the user's credit balance using localStorage.
// Credits are used when the user doesn't have their own API key.
//
// HOW IT WORKS:
// - New users get 20 free credits
// - Each translation uses 1 credit
// - Credits persist across browser sessions (localStorage)
// - When credits run out, user needs to buy more

"use client";

import { useState, useEffect, useCallback } from "react";
import { CreditsState, INITIAL_CREDITS } from "@/lib/types";

// Key used in localStorage
const STORAGE_KEY = "code-translator-credits";

export function useCredits() {
  // ===== STATE =====
  const [credits, setCredits] = useState<CreditsState>({
    total: INITIAL_CREDITS,
    used: 0,
    remaining: INITIAL_CREDITS,
  });

  // Track if we've loaded from localStorage yet
  const [isLoaded, setIsLoaded] = useState(false);

  // ===== LOAD FROM LOCALSTORAGE ON MOUNT =====
  useEffect(() => {
    // Only runs in browser (not during server-side rendering)
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      // User has existing credits
      try {
        const parsed = JSON.parse(stored) as CreditsState;
        setCredits(parsed);
      } catch {
        // If parsing fails, start fresh
        console.error("Failed to parse stored credits, using defaults");
      }
    }
    // If no stored credits, keep the default (20 free credits)

    setIsLoaded(true);
  }, []);

  // ===== SAVE TO LOCALSTORAGE WHEN CREDITS CHANGE =====
  useEffect(() => {
    // Don't save until we've loaded (to avoid overwriting with defaults)
    if (!isLoaded) return;
    if (typeof window === "undefined") return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(credits));
  }, [credits, isLoaded]);

  // ===== USE A CREDIT =====
  // Call this after a successful translation
  const useCredit = useCallback(() => {
    setCredits((prev) => ({
      ...prev,
      used: prev.used + 1,
      remaining: prev.remaining - 1,
    }));
  }, []);

  // ===== ADD CREDITS =====
  // Call this when user purchases more credits
  const addCredits = useCallback((amount: number) => {
    setCredits((prev) => ({
      total: prev.total + amount,
      used: prev.used,
      remaining: prev.remaining + amount,
    }));
  }, []);

  // ===== CHECK IF USER HAS CREDITS =====
  const hasCredits = credits.remaining > 0;

  // ===== RETURN EVERYTHING =====
  return {
    credits,
    hasCredits,
    useCredit,
    addCredits,
    isLoaded,
  };
}
