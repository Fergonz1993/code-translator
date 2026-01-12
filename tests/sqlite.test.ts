// ===== SQLITE UTILITIES TESTS =====
// Covers environment parsing and helper behaviors.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";

describe("sqlite utilities", () => {
  const originalTimeout = process.env.SQLITE_BUSY_TIMEOUT_MS;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalTimeout === undefined) delete process.env.SQLITE_BUSY_TIMEOUT_MS;
    else process.env.SQLITE_BUSY_TIMEOUT_MS = originalTimeout;
  });

  it("getSqliteBusyTimeoutMs uses default when env is missing", async () => {
    delete process.env.SQLITE_BUSY_TIMEOUT_MS;
    const { getSqliteBusyTimeoutMs } = await import("@/lib/sqlite");
    expect(getSqliteBusyTimeoutMs()).toBeGreaterThan(0);
  });

  it("getSqliteBusyTimeoutMs falls back on non-numeric env", async () => {
    process.env.SQLITE_BUSY_TIMEOUT_MS = "not-a-number";
    const { getSqliteBusyTimeoutMs } = await import("@/lib/sqlite");
    expect(getSqliteBusyTimeoutMs()).toBeGreaterThan(0);
  });

  it("getSqliteBusyTimeoutMs clamps negative values to 0", async () => {
    process.env.SQLITE_BUSY_TIMEOUT_MS = "-10";
    const { getSqliteBusyTimeoutMs } = await import("@/lib/sqlite");
    expect(getSqliteBusyTimeoutMs()).toBe(0);
  });

  it("getSqliteBusyTimeoutMs floors float values", async () => {
    process.env.SQLITE_BUSY_TIMEOUT_MS = "12.9";
    const { getSqliteBusyTimeoutMs } = await import("@/lib/sqlite");
    expect(getSqliteBusyTimeoutMs()).toBe(12);
  });

  it("ensureSqliteDirectory no-ops for :memory: and blank paths", async () => {
    const mkdirSpy = vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined as never);

    const { ensureSqliteDirectory } = await import("@/lib/sqlite");

    ensureSqliteDirectory(":memory:");
    ensureSqliteDirectory("   ");

    expect(mkdirSpy).not.toHaveBeenCalled();
    mkdirSpy.mockRestore();
  });

  it("ensureSqliteDirectory creates the parent directory", async () => {
    const mkdirSpy = vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined as never);

    const { ensureSqliteDirectory } = await import("@/lib/sqlite");

    ensureSqliteDirectory("/tmp/app/data/test.sqlite");

    expect(mkdirSpy).toHaveBeenCalledTimes(1);
    mkdirSpy.mockRestore();
  });

  it("configureSqlitePragmas sets the expected pragmas", async () => {
    const pragma = vi.fn();
    const { configureSqlitePragmas } = await import("@/lib/sqlite");

    configureSqlitePragmas({ pragma });

    expect(pragma).toHaveBeenCalledWith("journal_mode = WAL");
    expect(pragma).toHaveBeenCalledWith("synchronous = NORMAL");
    expect(pragma).toHaveBeenCalledWith(expect.stringContaining("busy_timeout"));
  });
});
