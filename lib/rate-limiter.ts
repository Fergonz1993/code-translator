// ===== RATE LIMITER =====
// In-memory sliding window rate limiter to prevent abuse.
// Uses a simple token bucket approach with per-session tracking.

// ===== TYPES =====

interface RateLimitEntry {
    tokens: number;        // Available tokens
    lastRefill: number;    // Timestamp of last refill
}

interface RateLimitConfig {
    maxTokens: number;     // Maximum tokens in bucket
    refillRate: number;    // Tokens added per second
    windowMs: number;      // Time window in milliseconds
}

// ===== CONFIGURATION =====

// Different limits for different modes
export const RATE_LIMIT_CONFIG = {
    // Credits mode: More restrictive (using our API keys)
    credits: {
        maxTokens: 60,       // Max 60 requests
        refillRate: 1,       // 1 token per second
        windowMs: 60_000,    // Per minute
    } satisfies RateLimitConfig,

    // BYOK mode: More permissive (using user's own keys)
    byok: {
        maxTokens: 120,      // Max 120 requests
        refillRate: 2,       // 2 tokens per second
        windowMs: 60_000,    // Per minute
    } satisfies RateLimitConfig,
} as const;

// ===== IN-MEMORY STORE =====
// Note: In production with multiple instances, use Redis instead

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const ENTRY_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanupTimer() {
    if (cleanupTimer) return;

    cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (now - entry.lastRefill > ENTRY_MAX_AGE_MS) {
                rateLimitStore.delete(key);
            }
        }
    }, CLEANUP_INTERVAL_MS);

    // Don't prevent Node.js from exiting
    if (cleanupTimer.unref) {
        cleanupTimer.unref();
    }
}

// ===== RATE LIMIT CHECK =====

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetMs: number;       // Milliseconds until reset
    retryAfterMs?: number; // When to retry if blocked
}

/**
 * Check if a request is allowed under rate limits.
 * Uses token bucket algorithm with sliding window.
 */
export function checkRateLimit(
    sessionId: string,
    mode: "credits" | "byok"
): RateLimitResult {
    startCleanupTimer();

    const config = RATE_LIMIT_CONFIG[mode];
    const now = Date.now();
    const key = `${mode}:${sessionId}`;

    // Get or create entry
    let entry = rateLimitStore.get(key);

    if (!entry) {
        entry = {
            tokens: config.maxTokens,
            lastRefill: now,
        };
        rateLimitStore.set(key, entry);
    }

    // Calculate tokens to add based on time elapsed
    const elapsed = now - entry.lastRefill;
    const tokensToAdd = Math.floor((elapsed / 1000) * config.refillRate);

    if (tokensToAdd > 0) {
        entry.tokens = Math.min(config.maxTokens, entry.tokens + tokensToAdd);
        // Correctly update lastRefill to account for partial tokens
        entry.lastRefill += (tokensToAdd * 1000) / config.refillRate;
    }

    // Check if request is allowed
    if (entry.tokens >= 1) {
        entry.tokens -= 1;
        return {
            allowed: true,
            remaining: entry.tokens,
            resetMs: config.windowMs,
        };
    }

    // Request denied - calculate retry time
    const tokensNeeded = 1;
    const secondsUntilToken = tokensNeeded / config.refillRate;
    const retryAfterMs = Math.ceil(secondsUntilToken * 1000);

    return {
        allowed: false,
        remaining: 0,
        resetMs: config.windowMs,
        retryAfterMs,
    };
}

/**
 * Reset rate limit for a session (useful for testing or admin actions)
 */
export function resetRateLimit(sessionId: string, mode: "credits" | "byok"): void {
    const key = `${mode}:${sessionId}`;
    rateLimitStore.delete(key);
}

/**
 * Get current rate limit status without consuming a token
 */
export function getRateLimitStatus(
    sessionId: string,
    mode: "credits" | "byok"
): { remaining: number; maxTokens: number } {
    const config = RATE_LIMIT_CONFIG[mode];
    const key = `${mode}:${sessionId}`;
    const entry = rateLimitStore.get(key);

    if (!entry) {
        return { remaining: config.maxTokens, maxTokens: config.maxTokens };
    }

    // Calculate current tokens with refill
    const now = Date.now();
    const elapsed = now - entry.lastRefill;
    const tokensToAdd = Math.floor((elapsed / 1000) * config.refillRate);
    const currentTokens = Math.min(config.maxTokens, entry.tokens + tokensToAdd);

    return { remaining: currentTokens, maxTokens: config.maxTokens };
}
