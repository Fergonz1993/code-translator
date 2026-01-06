import { describe, it, expect, vi } from "vitest";
import { isRetryableError, withRetry } from "@/lib/services/retry";

describe("isRetryableError", () => {
  it("returns true for retryable status codes", () => {
    expect(isRetryableError({ status: 429 })).toBe(true);
    expect(isRetryableError({ status: 503 })).toBe(true);
  });

  it("returns false for invalid api key errors", () => {
    expect(isRetryableError(new Error("Invalid API key"))).toBe(false);
  });

  it("returns true for timeout messages", () => {
    expect(isRetryableError(new Error("Request timed out"))).toBe(true);
  });
});

describe("withRetry", () => {
  it("retries transient errors and succeeds", async () => {
    vi.useFakeTimers();
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce("ok");

    const promise = withRetry(fn, {
      retries: 2,
      baseDelayMs: 10,
      maxDelayMs: 50,
      shouldRetry: () => true,
    });

    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("stops when error is not retryable", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Invalid API key"));

    await expect(withRetry(fn, {
      retries: 2,
      baseDelayMs: 10,
      maxDelayMs: 50,
      shouldRetry: () => false,
    })).rejects.toThrow("Invalid API key");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
