// ===== USE HISTORY HOOK =====
// Manages the user's translation history in localStorage.
// Saves past translations and allows deleting them.

"use client";

import { useState, useEffect, useCallback } from "react";
import { HistoryItem, MAX_HISTORY_ITEMS } from "@/lib/types";

const HISTORY_STORAGE_KEY = "code_translator_history";

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const normalizeTranslations = (translations: HistoryItem["translations"]) => {
    if (!Array.isArray(translations)) return [];

    return translations.map((item, index) => {
      // Valid if number and positive
      if (typeof item.lineNumber === "number" && item.lineNumber > 0) {
        return item;
      }

      return {
        ...item,
        lineNumber: index + 1,
      };
    });
  };

  // ===== LOAD HISTORY =====
  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as HistoryItem[];
        const normalized = Array.isArray(parsed)
          ? parsed.map((item) => ({
              ...item,
              translations: normalizeTranslations(item.translations),
            }))
          : [];

        setHistory(normalized);
      } catch (err) {
        console.error("Failed to parse history:", err);
        setHistory([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // ===== SAVE HISTORY =====
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    }
  }, [history, isLoaded]);

  // ===== ADD TO HISTORY =====
  const addToHistory = useCallback((item: Omit<HistoryItem, "id" | "timestamp">) => {
    setHistory((prev) => {
      // Don't add if it's the exact same as the most recent one
      const lastItem = prev[0];
      if (lastItem && lastItem.code === item.code && lastItem.language === item.language) {
        return prev;
      }

      const newItem: HistoryItem = {
        ...item,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      // Add to front of list and limit size
      return [newItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  // ===== DELETE FROM HISTORY =====
  const deleteItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // ===== CLEAR ALL HISTORY =====
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addToHistory,
    deleteItem,
    clearHistory,
    isLoaded,
  };
}
