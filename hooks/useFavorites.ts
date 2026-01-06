// ===== FAVORITES/BOOKMARKS HOOK =====
// Save and manage favorite translations.

"use client";

import { useState, useCallback, useEffect } from "react";

export interface FavoriteItem {
  id: string;
  code: string;
  language: string;
  translations: Array<{ lineNumber: number; line: string; english: string }>;
  createdAt: number;
  title?: string;
}

const STORAGE_KEY = "code-translator-favorites";
const MAX_FAVORITES = 50;

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage
  const persist = useCallback((items: FavoriteItem[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  // Add a favorite
  const addFavorite = useCallback(
    (item: Omit<FavoriteItem, "id" | "createdAt">) => {
      const newItem: FavoriteItem = {
        ...item,
        id: Math.random().toString(36).slice(2),
        createdAt: Date.now(),
      };

      setFavorites((prev) => {
        const updated = [newItem, ...prev].slice(0, MAX_FAVORITES);
        persist(updated);
        return updated;
      });

      return newItem.id;
    },
    [persist]
  );

  // Remove a favorite
  const removeFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const updated = prev.filter((f) => f.id !== id);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  // Update favorite title
  const updateTitle = useCallback(
    (id: string, title: string) => {
      setFavorites((prev) => {
        const updated = prev.map((f) =>
          f.id === id ? { ...f, title } : f
        );
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  // Check if code is favorited
  const isFavorite = useCallback(
    (code: string) => favorites.some((f) => f.code === code),
    [favorites]
  );

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites([]);
    persist([]);
  }, [persist]);

  return {
    favorites,
    isLoaded,
    addFavorite,
    removeFavorite,
    updateTitle,
    isFavorite,
    clearFavorites,
    count: favorites.length,
  };
}
