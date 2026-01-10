// ===== TRANSLATION CACHE TESTS =====
// Tests for the translation caching system.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import {
    getCachedTranslation,
    setCachedTranslation,
    cleanExpiredCache,
    getCacheStats,
    clearCache,
    generateCacheKey,
    getMemoryCacheStats,
    closeDb,
} from "@/lib/services/translation-cache";
import type { TranslatedLine } from "@/lib/types";
import Database from "better-sqlite3";

// ===== TEST SETUP =====

const TEST_CACHE_DIR = path.join(process.cwd(), "data", "test");
const TEST_CACHE_PATH = path.join(TEST_CACHE_DIR, "cache-test.sqlite");

process.env.CACHE_DB_PATH = TEST_CACHE_PATH;

function cleanupTestDb() {
    try {
        if (fs.existsSync(TEST_CACHE_PATH)) fs.unlinkSync(TEST_CACHE_PATH);
        const walPath = TEST_CACHE_PATH + "-wal";
        const shmPath = TEST_CACHE_PATH + "-shm";
        if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
        if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch {
        // Ignore cleanup errors
    }
}

const sampleTranslations: TranslatedLine[] = [
    { lineNumber: 1, line: "const x = 5;", english: "Create a variable x with value 5" },
    { lineNumber: 2, line: "console.log(x);", english: "Print x to the console" },
];

describe("translation-cache", () => {
    beforeEach(() => {
        fs.mkdirSync(TEST_CACHE_DIR, { recursive: true });
        clearCache();
    });

    afterEach(() => {
        closeDb();
        cleanupTestDb();
    });

    describe("database setup", () => {
        it("should configure busy_timeout pragma", () => {
            closeDb(); // Force reset so next call triggers getDb logic
            const pragmaSpy = vi.spyOn(Database.prototype, "pragma");

            getCachedTranslation({
                code: "code1",
                language: "ts",
                model: "gpt-4o-mini",
            });

            expect(pragmaSpy).toHaveBeenCalledWith(expect.stringContaining("busy_timeout"));
            pragmaSpy.mockRestore();
        });
    });

    describe("generateCacheKey", () => {
        it("should generate consistent keys for same input", () => {
            const key1 = generateCacheKey({ code: "const x = 1;", language: "typescript", model: "gpt-4o-mini" });
            const key2 = generateCacheKey({ code: "const x = 1;", language: "typescript", model: "gpt-4o-mini" });
            expect(key1).toBe(key2);
        });

        it("should generate different keys for different code", () => {
            const key1 = generateCacheKey({ code: "const x = 1;", language: "typescript", model: "gpt-4o-mini" });
            const key2 = generateCacheKey({ code: "const x = 2;", language: "typescript", model: "gpt-4o-mini" });
            expect(key1).not.toBe(key2);
        });

        it("should generate different keys for different models", () => {
            const key1 = generateCacheKey({ code: "const x = 1;", language: "typescript", model: "gpt-4o-mini" });
            const key2 = generateCacheKey({ code: "const x = 1;", language: "typescript", model: "gpt-4o" });
            expect(key1).not.toBe(key2);
        });
    });

    describe("setCachedTranslation and getCachedTranslation", () => {
        it("should store and retrieve translations", () => {
            setCachedTranslation({
                code: "const x = 1;",
                language: "typescript",
                model: "gpt-4o-mini",
                translations: sampleTranslations,
            });

            const cached = getCachedTranslation({
                code: "const x = 1;",
                language: "typescript",
                model: "gpt-4o-mini",
            });

            expect(cached).not.toBeNull();
            expect(cached!.translations).toHaveLength(2);
            expect(cached!.translations[0].english).toBe("Create a variable x with value 5");
        });

        it("should not persist raw code in the cache database", () => {
            const code = "const secret = 123;";
            const language = "typescript";
            const model = "gpt-4o-mini";

            setCachedTranslation({
                code,
                language,
                model,
                translations: sampleTranslations,
            });

            // Close the shared DB connection so we can inspect the on-disk DB cleanly.
            closeDb();

            const db = new Database(TEST_CACHE_PATH);
            const hash = generateCacheKey({ code, language, model });
            const row = db
                .prepare("SELECT code FROM translation_cache WHERE hash = ?")
                .get(hash) as { code: string } | undefined;
            db.close();

            expect(row).toBeDefined();
            expect(row!.code).toBe("[redacted]");
        });

        it("should return null for non-existent cache", () => {
            const cached = getCachedTranslation({
                code: "nonexistent",
                language: "typescript",
                model: "gpt-4o-mini",
            });

            expect(cached).toBeNull();
        });

        it("should increment hit count on access", () => {
            setCachedTranslation({
                code: "const x = 1;",
                language: "typescript",
                model: "gpt-4o-mini",
                translations: sampleTranslations,
            });

            const first = getCachedTranslation({ code: "const x = 1;", language: "typescript", model: "gpt-4o-mini" });
            const second = getCachedTranslation({ code: "const x = 1;", language: "typescript", model: "gpt-4o-mini" });

            expect(first!.hitCount).toBe(1);
            expect(second!.hitCount).toBe(2);
        });
    });

    describe("getCacheStats", () => {
        it("should return correct statistics", () => {
            setCachedTranslation({
                code: "code1",
                language: "ts",
                model: "gpt-4o-mini",
                translations: sampleTranslations,
            });

            setCachedTranslation({
                code: "code2",
                language: "ts",
                model: "gpt-4o-mini",
                translations: sampleTranslations,
            });

            // Access first cache entry twice
            getCachedTranslation({ code: "code1", language: "ts", model: "gpt-4o-mini" });
            getCachedTranslation({ code: "code1", language: "ts", model: "gpt-4o-mini" });

            const stats = getCacheStats();
            expect(stats.totalEntries).toBe(2);
            expect(stats.totalHits).toBe(2);
        });
    });

    describe("clearCache", () => {
        it("should remove all entries", () => {
            setCachedTranslation({
                code: "code1",
                language: "ts",
                model: "gpt-4o-mini",
                translations: sampleTranslations,
            });

            const deleted = clearCache();
            expect(deleted).toBe(1);

            const stats = getCacheStats();
            expect(stats.totalEntries).toBe(0);
        });
    });

    describe("memory LRU cache", () => {
        it("should evict least recently used entries when over limit", () => {
            const originalLimit = process.env.CACHE_LRU_MAX_ENTRIES;
            process.env.CACHE_LRU_MAX_ENTRIES = "1";

            try {
                const firstKey = generateCacheKey({
                    code: "code1",
                    language: "ts",
                    model: "gpt-4o-mini",
                });
                const secondKey = generateCacheKey({
                    code: "code2",
                    language: "ts",
                    model: "gpt-4o-mini",
                });

                setCachedTranslation({
                    code: "code1",
                    language: "ts",
                    model: "gpt-4o-mini",
                    translations: sampleTranslations,
                });
                setCachedTranslation({
                    code: "code2",
                    language: "ts",
                    model: "gpt-4o-mini",
                    translations: sampleTranslations,
                });

                const afterInsert = getMemoryCacheStats();
                expect(afterInsert.entries).toBe(1);
                expect(afterInsert.keys).toEqual([secondKey]);

                getCachedTranslation({
                    code: "code1",
                    language: "ts",
                    model: "gpt-4o-mini",
                });

                const afterAccess = getMemoryCacheStats();
                expect(afterAccess.entries).toBe(1);
                expect(afterAccess.keys).toEqual([firstKey]);
            } finally {
                if (originalLimit === undefined) {
                    delete process.env.CACHE_LRU_MAX_ENTRIES;
                } else {
                    process.env.CACHE_LRU_MAX_ENTRIES = originalLimit;
                }
            }
        });
    });
});
