// ===== DEBOUNCE HOOK =====
// This hook waits for the user to STOP typing before doing something.
//
// WHY WE NEED THIS:
// Without debounce, we would call the API on every single keystroke.
// That's wasteful and expensive. Instead, we wait 800ms after the user
// stops typing, THEN we call the API.
//
// ANALOGY: It's like a polite assistant who waits for you to finish
// your sentence before responding, instead of interrupting after every word.

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  // This stores the "debounced" value - the value we'll actually use
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Every time the value changes, we start a timer
    // If the value changes again before the timer finishes,
    // we cancel the old timer and start a new one
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // This "cleanup" function runs when the value changes
    // It cancels the previous timer so we start fresh
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
