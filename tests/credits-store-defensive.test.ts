// ===== CREDITS STORE DEFENSIVE TESTS =====
// Covers defensive branches that are hard to reach with the real SQLite implementation.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("credits-store (defensive)", () => {
  const originalDbPath = process.env.CREDITS_DB_PATH;

  beforeEach(() => {
    vi.resetModules();
    process.env.CREDITS_DB_PATH = ":memory:";
  });

  afterEach(() => {
    vi.resetModules();
    vi.unmock("better-sqlite3");
    vi.unmock("@/lib/sqlite");

    if (originalDbPath === undefined) delete process.env.CREDITS_DB_PATH;
    else process.env.CREDITS_DB_PATH = originalDbPath;
  });

  function mockSqliteWithMissingBalanceRow() {
    vi.doMock("better-sqlite3", () => {
      const fakeDb = {
        pragma: vi.fn(),
        exec: vi.fn(),
        close: vi.fn(),
        transaction: (fn: any) => () => fn(),
        prepare: (sql: string) => {
          if (sql.includes("SELECT session_id FROM credits_balance")) {
            return { get: vi.fn(() => ({ session_id: "session-123" })) };
          }

          if (sql.includes("SELECT total, used FROM credits_balance")) {
            return { get: vi.fn(() => undefined) };
          }

          return {
            get: vi.fn(() => undefined),
            run: vi.fn(() => ({ changes: 0 })),
          };
        },
      };

      return {
        default: function Database() {
          return fakeDb;
        },
      };
    });
  }

  it("getCreditsBalance falls back when the balance row is missing", async () => {
    mockSqliteWithMissingBalanceRow();

    const { getCreditsBalance, closeDb } = await import("@/lib/credits-store");

    const balance = getCreditsBalance("session-123");
    expect(balance).toEqual({ total: 20, used: 0, remaining: 20 });

    closeDb();
  });

  it("consumeCredits returns ok=false when the balance row is missing", async () => {
    mockSqliteWithMissingBalanceRow();

    const { consumeCredits, closeDb } = await import("@/lib/credits-store");

    const result = consumeCredits({
      sessionId: "session-123",
      amount: 1,
      source: "test",
      idempotencyKey: "idempotency:test",
    });

    expect(result.ok).toBe(false);
    expect(result.balance).toEqual({ total: 20, used: 0, remaining: 20 });
    expect(result.charged).toBe(false);

    closeDb();
  });

  it("uses the default DB path when CREDITS_DB_PATH is not set", async () => {
    delete process.env.CREDITS_DB_PATH;

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
        transaction: (fn: any) => () => fn(),
        prepare: (sql: string) => {
          if (sql.includes("SELECT session_id FROM credits_balance")) {
            return { get: vi.fn(() => ({ session_id: "session-123" })) };
          }

          if (sql.includes("SELECT total, used FROM credits_balance")) {
            return { get: vi.fn(() => ({ total: 20, used: 0 })) };
          }

          return { get: vi.fn(() => undefined), run: vi.fn(() => ({ changes: 0 })) };
        },
      };

      return {
        default: function Database(pathArg: string) {
          usedPath = pathArg;
          return fakeDb;
        },
      };
    });

    const { getCreditsBalance, closeDb } = await import("@/lib/credits-store");

    getCreditsBalance("session-123");

    expect(usedPath).toBeTruthy();
    expect(usedPath!).toContain("data");
    expect(usedPath!).toContain("credits.sqlite");

    closeDb();
  });
});
