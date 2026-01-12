// ===== RATE LIMITER TESTS =====
// Tests for the token bucket rate limiting system.

import { describe, it, expect, afterEach, vi } from "vitest";
import {
    checkRateLimit,
    resetRateLimit,
    getRateLimitStatus,
    RATE_LIMIT_CONFIG
} from "@/lib/rate-limiter";

// Generate unique session IDs for each test
function uniqueSessionId(): string {
    return `test-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("rate-limiter", () => {
    describe("checkRateLimit", () => {
        it("cleans only stale entries", () => {
            const deleteSpy = vi.spyOn(Map.prototype, "delete");
            const nowSpy = vi.spyOn(Date, "now");
            nowSpy.mockReturnValue(0);

            let cleanupCallback: (() => void) | undefined;
            vi.spyOn(globalThis, "setInterval").mockImplementation((fn: any) => {
                cleanupCallback = fn;

                // In JSDOM, setInterval returns a numeric ID (no `unref`).
                // Returning a number covers the "no unref" branch.
                return 1 as any;
            });

            const sessionId = uniqueSessionId();
            checkRateLimit(sessionId, "credits");

            expect(typeof cleanupCallback).toBe("function");

            // Not stale yet.
            cleanupCallback?.();
            expect(deleteSpy).not.toHaveBeenCalled();

            // Stale now.
            nowSpy.mockReturnValue(15 * 60 * 1000);
            cleanupCallback?.();
            expect(deleteSpy).toHaveBeenCalledWith(`credits:${sessionId}`);
        });

        it("should allow first request", () => {
            const sessionId = uniqueSessionId();
            const result = checkRateLimit(sessionId, "credits");

            expect(result.allowed).toBe(true);
            expect(result.remaining).toBe(RATE_LIMIT_CONFIG.credits.maxTokens - 1);
        });

        it("should track remaining tokens correctly", () => {
            const sessionId = uniqueSessionId();

            // Make 5 requests
            for (let i = 0; i < 5; i++) {
                checkRateLimit(sessionId, "credits");
            }

            const status = getRateLimitStatus(sessionId, "credits");
            expect(status.remaining).toBe(RATE_LIMIT_CONFIG.credits.maxTokens - 5);
        });

        it("should block when tokens exhausted", () => {
            const sessionId = uniqueSessionId();
            const maxTokens = RATE_LIMIT_CONFIG.credits.maxTokens;

            // Exhaust all tokens
            for (let i = 0; i < maxTokens; i++) {
                const result = checkRateLimit(sessionId, "credits");
                expect(result.allowed).toBe(true);
            }

            // Next request should be blocked
            const blockedResult = checkRateLimit(sessionId, "credits");
            expect(blockedResult.allowed).toBe(false);
            expect(blockedResult.remaining).toBe(0);
            expect(blockedResult.retryAfterMs).toBeDefined();
        });

        it("should isolate sessions", () => {
            const session1 = uniqueSessionId();
            const session2 = uniqueSessionId();

            // Consume tokens from session1
            for (let i = 0; i < 10; i++) {
                checkRateLimit(session1, "credits");
            }

            // Session2 should still have full quota
            const status1 = getRateLimitStatus(session1, "credits");
            const status2 = getRateLimitStatus(session2, "credits");

            expect(status1.remaining).toBe(RATE_LIMIT_CONFIG.credits.maxTokens - 10);
            expect(status2.remaining).toBe(RATE_LIMIT_CONFIG.credits.maxTokens);
        });

        it("should have higher limits for BYOK mode", () => {
            expect(RATE_LIMIT_CONFIG.byok.maxTokens).toBeGreaterThan(
                RATE_LIMIT_CONFIG.credits.maxTokens
            );
        });

        it("should refill tokens over time", () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date(0));

            const sessionId = uniqueSessionId();

            const first = checkRateLimit(sessionId, "credits");
            expect(first.allowed).toBe(true);

            // Advance 1 second so at least 1 token refills.
            vi.setSystemTime(new Date(1000));

            const second = checkRateLimit(sessionId, "credits");
            expect(second.allowed).toBe(true);
        });

        it("should clean up stale entries", async () => {
            // This test needs a fresh module instance so the internal cleanup timer is not already set.
            vi.resetModules();

            const intervalSpy = vi
                .spyOn(globalThis, "setInterval")
                .mockImplementation(() => ({ unref: () => {} } as any));

            const deleteSpy = vi.spyOn(Map.prototype, "delete");
            const nowSpy = vi.spyOn(Date, "now").mockReturnValue(0);

            const { checkRateLimit: freshCheckRateLimit } = await import("@/lib/rate-limiter");

            const sessionId = uniqueSessionId();
            freshCheckRateLimit(sessionId, "credits");

            const cleanupCallback = intervalSpy.mock.calls[0]?.[0] as
                | (() => void)
                | undefined;
            expect(typeof cleanupCallback).toBe("function");

            // Make the entry look old enough to be removed.
            nowSpy.mockReturnValue(15 * 60 * 1000);
            cleanupCallback!();

            expect(deleteSpy).toHaveBeenCalledWith(`credits:${sessionId}`);
        });

        it("unrefs the cleanup timer when available", async () => {
            vi.resetModules();

            const unrefSpy = vi.fn();
            vi.spyOn(globalThis, "setInterval").mockImplementation(() => ({
                unref: unrefSpy,
            }) as any);

            const { checkRateLimit: freshCheckRateLimit } = await import("@/lib/rate-limiter");
            freshCheckRateLimit(uniqueSessionId(), "credits");

            expect(unrefSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("resetRateLimit", () => {
        it("should reset tokens to max", () => {
            const sessionId = uniqueSessionId();

            // Use some tokens
            for (let i = 0; i < 10; i++) {
                checkRateLimit(sessionId, "credits");
            }

            // Reset
            resetRateLimit(sessionId, "credits");

            // Should have full quota again
            const status = getRateLimitStatus(sessionId, "credits");
            expect(status.remaining).toBe(RATE_LIMIT_CONFIG.credits.maxTokens);
        });
    });

    describe("getRateLimitStatus", () => {
        it("should return max tokens for new session", () => {
            const sessionId = uniqueSessionId();
            const status = getRateLimitStatus(sessionId, "credits");

            expect(status.remaining).toBe(RATE_LIMIT_CONFIG.credits.maxTokens);
            expect(status.maxTokens).toBe(RATE_LIMIT_CONFIG.credits.maxTokens);
        });

        it("should not consume tokens", () => {
            const sessionId = uniqueSessionId();

            // Check status multiple times
            getRateLimitStatus(sessionId, "credits");
            getRateLimitStatus(sessionId, "credits");
            getRateLimitStatus(sessionId, "credits");

            // Should still have full quota
            const status = getRateLimitStatus(sessionId, "credits");
            expect(status.remaining).toBe(RATE_LIMIT_CONFIG.credits.maxTokens);
        });
    });
});
