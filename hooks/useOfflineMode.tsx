// ===== OFFLINE MODE HOOK =====
// Detect and handle offline state.

"use client";

import { useState, useEffect, useCallback } from "react";

interface OfflineState {
  isOnline: boolean;
  wasOffline: boolean; // Was offline at some point in this session
  lastOnlineAt: Date | null;
}

export function useOfflineMode() {
  const [state, setState] = useState<OfflineState>({
    isOnline: true,
    wasOffline: false,
    lastOnlineAt: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Set initial state
    setState((prev) => ({
      ...prev,
      isOnline: navigator.onLine,
      lastOnlineAt: navigator.onLine ? new Date() : null,
    }));

    const handleOnline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: true,
        lastOnlineAt: new Date(),
      }));
    };

    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: false,
        wasOffline: true,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Force refresh data when coming back online
  const refreshOnReconnect = useCallback(async (refreshFn: () => Promise<void>) => {
    if (state.isOnline && state.wasOffline) {
      await refreshFn();
    }
  }, [state.isOnline, state.wasOffline]);

  return {
    ...state,
    refreshOnReconnect,
  };
}

// ===== OFFLINE INDICATOR COMPONENT =====
export function OfflineIndicator() {
  const { isOnline } = useOfflineMode();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 px-4 py-2 bg-yellow-500/90 text-yellow-900 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-left">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12v.01"
        />
      </svg>
      <span className="text-sm font-medium">You&apos;re offline</span>
    </div>
  );
}
