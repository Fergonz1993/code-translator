// ===== SWIPE GESTURE HOOK =====
// Detect swipe gestures for mobile navigation.

"use client";

import { useState, useRef, useCallback } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeState {
  swiping: boolean;
  direction: "left" | "right" | "up" | "down" | null;
  deltaX: number;
  deltaY: number;
}

const SWIPE_THRESHOLD = 50; // Minimum distance for swipe detection

export function useSwipe(handlers: SwipeHandlers) {
  const [state, setState] = useState<SwipeState>({
    swiping: false,
    direction: null,
    deltaX: 0,
    deltaY: 0,
  });

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setState({ swiping: true, direction: null, deltaX: 0, deltaY: 0 });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    let direction: SwipeState["direction"] = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? "right" : "left";
    } else {
      direction = deltaY > 0 ? "down" : "up";
    }

    setState({ swiping: true, direction, deltaX, deltaY });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current) return;

    const { direction, deltaX, deltaY } = state;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > SWIPE_THRESHOLD && absX > absY) {
      if (direction === "left") handlers.onSwipeLeft?.();
      if (direction === "right") handlers.onSwipeRight?.();
    } else if (absY > SWIPE_THRESHOLD && absY > absX) {
      if (direction === "up") handlers.onSwipeUp?.();
      if (direction === "down") handlers.onSwipeDown?.();
    }

    touchStartRef.current = null;
    setState({ swiping: false, direction: null, deltaX: 0, deltaY: 0 });
  }, [state, handlers]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    ...state,
  };
}
