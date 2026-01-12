// ===== TRANSLATION CACHE DEFENSIVE TESTS =====
// Covers defensive branches that are hard to reach with the real SQLite implementation.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("translation-cache (defensive)", () => {
  const originalDbPath = process.env.CACHE_DB_PATH;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.CACHE_DB_PATH;
  });

  afterEach(() => {
    vi.resetModules();
    vi.unmock("better-sqlite3");
    vi.unmock("@/lib/sqlite");

    if (originalDbPath === undefined) delete process.env.CACHE_DB_PATH;
    else process.env.CACHE_DB_PATH = originalDbPath;
  });

  it("uses the default DB path when CACHE_DB_PATH is not set", async () => {
    let usedPath: string | null = null;

    vi.doMock("@/lib/sqlite", () => {
      return {
        configureSqlitePragmas: vi.fn(),
        ensureSqliteDirectory: vi.fn(),
      };
    });

    vi.doMock("better-sqlite3", () => {
      const fakeDb = {
        pragma: vi.fn(),
        exec: vi.fn(),
        close: vi.fn(),
        prepare: () => ({
          run: vi.fn(() => ({ changes: 0 })),
          get: vi.fn(() => ({
            total_entries: 0,
            total_hits: 0,
            oldest_entry: null,
            newest_entry: null,
          })),
        }),
      };

      return {
        default: function Database(pathArg: string) {
          usedPath = pathArg;
          return fakeDb;
        },
      };
    });

    const { getCacheStats, closeDb } = await import("@/lib/services/translation-cache");

    const stats = getCacheStats();
    expect(stats.totalEntries).toBe(0);

    expect(usedPath).toBeTruthy();
    expect(usedPath!).toContain("data");
    expect(usedPath!).toContain("cache.sqlite");

    closeDb();
  });
});
