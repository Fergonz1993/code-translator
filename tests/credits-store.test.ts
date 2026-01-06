// ===== CREDITS STORE TESTS =====
// Comprehensive tests for the credits ledger system.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import {
    getCreditsBalance,
    grantCredits,
    consumeCredits,
    closeDb
} from "@/lib/credits-store";
import { INITIAL_CREDITS } from "@/lib/types";
import Database from "better-sqlite3";

// ===== TEST SETUP =====
// Use a temporary test database to avoid affecting production data

const TEST_DB_DIR = path.join(process.cwd(), "data", "test");
const TEST_DB_PATH = path.join(TEST_DB_DIR, "credits-test.sqlite");

// Set environment variable before importing the module
process.env.CREDITS_DB_PATH = TEST_DB_PATH;

function cleanupTestDb() {
    try {
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }
        // Also clean up WAL files
        const walPath = TEST_DB_PATH + "-wal";
        const shmPath = TEST_DB_PATH + "-shm";
        if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
        if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch {
        // Ignore cleanup errors
    }
}

// Generate unique session IDs for each test
function uniqueSessionId(): string {
    return `test-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe("credits-store", () => {
    beforeEach(() => {
        // Ensure test directory exists
        fs.mkdirSync(TEST_DB_DIR, { recursive: true });
    });

    afterEach(() => {
        closeDb();
        cleanupTestDb();
    });

    describe("database setup", () => {
        it("should configure busy_timeout pragma", () => {
            const pragmaSpy = vi.spyOn(Database.prototype, "pragma");
            const sessionId = uniqueSessionId();

            getCreditsBalance(sessionId);

            expect(pragmaSpy).toHaveBeenCalledWith(expect.stringContaining("busy_timeout"));
            pragmaSpy.mockRestore();
        });
    });

    // ===== getCreditsBalance TESTS =====

    describe("getCreditsBalance", () => {
        it("should return INITIAL_CREDITS for new sessions", () => {
            const sessionId = uniqueSessionId();
            const balance = getCreditsBalance(sessionId);

            expect(balance.total).toBe(INITIAL_CREDITS);
            expect(balance.used).toBe(0);
            expect(balance.remaining).toBe(INITIAL_CREDITS);
        });

        it("should return consistent balance for same session", () => {
            const sessionId = uniqueSessionId();

            const balance1 = getCreditsBalance(sessionId);
            const balance2 = getCreditsBalance(sessionId);

            expect(balance1).toEqual(balance2);
        });

        it("should isolate balances between different sessions", () => {
            const session1 = uniqueSessionId();
            const session2 = uniqueSessionId();

            // Consume credits from session1
            consumeCredits({ sessionId: session1, amount: 5, source: "test" });

            const balance1 = getCreditsBalance(session1);
            const balance2 = getCreditsBalance(session2);

            expect(balance1.remaining).toBe(INITIAL_CREDITS - 5);
            expect(balance2.remaining).toBe(INITIAL_CREDITS);
        });
    });

    // ===== grantCredits TESTS =====

    describe("grantCredits", () => {
        it("should add credits to existing balance", () => {
            const sessionId = uniqueSessionId();

            const newBalance = grantCredits({
                sessionId,
                amount: 50,
                source: "test_purchase",
            });

            expect(newBalance.total).toBe(INITIAL_CREDITS + 50);
            expect(newBalance.remaining).toBe(INITIAL_CREDITS + 50);
        });

        it("should be idempotent with same idempotencyKey", () => {
            const sessionId = uniqueSessionId();
            const idempotencyKey = `idem-${Date.now()}`;

            grantCredits({
                sessionId,
                amount: 100,
                source: "stripe",
                idempotencyKey,
            });

            // Second call with same key should not add more credits
            grantCredits({
                sessionId,
                amount: 100,
                source: "stripe",
                idempotencyKey,
            });

            const balance = getCreditsBalance(sessionId);
            expect(balance.total).toBe(INITIAL_CREDITS + 100);
        });

        it("should grant credits with different idempotencyKeys", () => {
            const sessionId = uniqueSessionId();
            const uniquePrefix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

            grantCredits({
                sessionId,
                amount: 50,
                source: "purchase1",
                idempotencyKey: `${uniquePrefix}-key1`,
            });

            grantCredits({
                sessionId,
                amount: 50,
                source: "purchase2",
                idempotencyKey: `${uniquePrefix}-key2`,
            });

            const balance = getCreditsBalance(sessionId);
            expect(balance.total).toBe(INITIAL_CREDITS + 100);
        });
    });

    // ===== consumeCredits TESTS =====

    describe("consumeCredits", () => {
        it("should deduct credits from balance", () => {
            const sessionId = uniqueSessionId();

            const result = consumeCredits({
                sessionId,
                amount: 1,
                source: "translation",
            });

            expect(result.ok).toBe(true);
            expect(result.charged).toBe(true);
            expect(result.balance.used).toBe(1);
            expect(result.balance.remaining).toBe(INITIAL_CREDITS - 1);
        });

        it("should fail when insufficient credits", () => {
            const sessionId = uniqueSessionId();

            const result = consumeCredits({
                sessionId,
                amount: INITIAL_CREDITS + 1,
                source: "translation",
            });

            expect(result.ok).toBe(false);
            expect(result.charged).toBe(false);
            expect(result.balance.remaining).toBe(INITIAL_CREDITS);
        });

        it("should be idempotent with same idempotencyKey", () => {
            const sessionId = uniqueSessionId();
            const idempotencyKey = `consume-${Date.now()}`;

            consumeCredits({
                sessionId,
                amount: 1,
                source: "translation",
                idempotencyKey,
            });

            // Second call should not charge again
            const result = consumeCredits({
                sessionId,
                amount: 1,
                source: "translation",
                idempotencyKey,
            });

            expect(result.ok).toBe(true);
            expect(result.charged).toBe(false);
            expect(result.balance.used).toBe(1);
        });

        it("should consume all remaining credits exactly", () => {
            const sessionId = uniqueSessionId();

            const result = consumeCredits({
                sessionId,
                amount: INITIAL_CREDITS,
                source: "bulk_translation",
            });

            expect(result.ok).toBe(true);
            expect(result.balance.remaining).toBe(0);
        });

        it("should fail after credits are exhausted", () => {
            const sessionId = uniqueSessionId();

            // Exhaust all credits
            consumeCredits({
                sessionId,
                amount: INITIAL_CREDITS,
                source: "exhaustion",
            });

            // Next consumption should fail
            const result = consumeCredits({
                sessionId,
                amount: 1,
                source: "translation",
            });

            expect(result.ok).toBe(false);
            expect(result.charged).toBe(false);
        });
    });

    // ===== GRANT + CONSUME INTEGRATION TESTS =====

    describe("grant and consume integration", () => {
        it("should allow consumption after granting more credits", () => {
            const sessionId = uniqueSessionId();

            // Exhaust initial credits
            consumeCredits({
                sessionId,
                amount: INITIAL_CREDITS,
                source: "exhaustion",
            });

            // Grant more credits
            grantCredits({
                sessionId,
                amount: 10,
                source: "purchase",
            });

            // Should now be able to consume
            const result = consumeCredits({
                sessionId,
                amount: 5,
                source: "translation",
            });

            expect(result.ok).toBe(true);
            expect(result.balance.remaining).toBe(5);
        });

        it("should handle refund scenario correctly", () => {
            const sessionId = uniqueSessionId();
            const requestId = `req-${Date.now()}`;

            // Consume credit
            consumeCredits({
                sessionId,
                amount: 1,
                source: "translation",
                idempotencyKey: `consume:${requestId}`,
            });

            // Refund (grant back)
            grantCredits({
                sessionId,
                amount: 1,
                source: "refund",
                idempotencyKey: `refund:${requestId}`,
            });

            const balance = getCreditsBalance(sessionId);
            expect(balance.remaining).toBe(INITIAL_CREDITS);
        });
    });
});
