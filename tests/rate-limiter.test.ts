// ===== RATE LIMITER TESTS =====
// Tests for the token bucket rate limiting system.

import { describe, it, expect, beforeEach } from "vitest";
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

describe("rate-limiter", () => {
    describe("checkRateLimit", () => {
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
