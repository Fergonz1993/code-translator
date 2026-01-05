// ===== HOOKS TESTS =====
// Tests for custom React hooks

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/hooks/useDebounce";

// ===== MOCK LOCALSTORAGE =====
// We need to mock localStorage since it doesn't exist in jsdom by default
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should return initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("test", 500));
    expect(result.current).toBe("test");
  });

  it("should debounce value changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    // Initial value
    expect(result.current).toBe("initial");

    // Change value
    rerender({ value: "changed", delay: 500 });

    // Should still be initial (debouncing)
    expect(result.current).toBe("initial");

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now should be changed
    expect(result.current).toBe("changed");
  });

  it("should cancel previous timeout on rapid changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "v1", delay: 500 } }
    );

    // Rapid changes
    rerender({ value: "v2", delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "v3", delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "v4", delay: 500 });

    // Should still be v1 (none have completed)
    expect(result.current).toBe("v1");

    // Complete the debounce
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should be v4 (last value)
    expect(result.current).toBe("v4");
  });
});
