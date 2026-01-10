// ===== SQLITE UTILITIES =====
// Small shared helpers for SQLite (better-sqlite3) setup.
//
// Why this file exists:
// - We configure SQLite in multiple places (credits ledger, translation cache, pooling).
// - Duplicated setup code can drift over time (different defaults, different env parsing).
// - Centralizing the logic keeps behavior consistent and makes it easier to test.

import fs from "fs";
import path from "path";
import { SQLITE_BUSY_TIMEOUT_MS } from "@/lib/constants";

// ===== BUSY TIMEOUT (LOCK WAIT) =====
// SQLite returns "database is locked" if another process/thread is writing.
// `busy_timeout` tells SQLite how long to wait (in ms) before giving up.
export function getSqliteBusyTimeoutMs(): number {
  const raw = process.env.SQLITE_BUSY_TIMEOUT_MS;
  if (!raw) return SQLITE_BUSY_TIMEOUT_MS;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return SQLITE_BUSY_TIMEOUT_MS;

  // SQLite expects a non-negative integer.
  return Math.max(0, Math.floor(parsed));
}

// ===== DIRECTORY HELPERS =====
// Ensure the parent folder exists so SQLite can create the .sqlite file.
export function ensureSqliteDirectory(dbPath: string): void {
  // `:memory:` is a special SQLite path that doesn't need directories.
  if (dbPath === ":memory:") return;

  // If someone passes a weird/empty string, do nothing.
  if (!dbPath.trim()) return;

  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

// ===== PRAGMA CONFIGURATION =====
// We accept a "duck typed" object so callers don't need to import Database types here.
export function configureSqlitePragmas(db: { pragma: (value: string) => unknown }): void {
  // WAL gives better concurrency for reads while writes happen.
  db.pragma("journal_mode = WAL");

  // A safer/faster default balance for server workloads.
  db.pragma("synchronous = NORMAL");

  // Standardized busy timeout across the app.
  db.pragma(`busy_timeout = ${getSqliteBusyTimeoutMs()}`);
}

