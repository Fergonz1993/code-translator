// ===== CREDITS LEDGER =====
// Server-side credits storage using SQLite for durability and idempotency.

import crypto from "crypto";
import path from "path";
import Database from "better-sqlite3";
import { CreditsState, INITIAL_CREDITS } from "@/lib/types";
import { configureSqlitePragmas, ensureSqliteDirectory } from "@/lib/sqlite";

// ===== DATABASE SETUP =====

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "credits.sqlite");

function resolveDbPath(): string {
  return process.env.CREDITS_DB_PATH || DEFAULT_DB_PATH;
}

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  const dbPath = resolveDbPath();
  ensureSqliteDirectory(dbPath);

  const db = new Database(dbPath);
  configureSqlitePragmas(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS credits_balance (
      session_id TEXT PRIMARY KEY,
      total INTEGER NOT NULL,
      used INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      source TEXT NOT NULL,
      idempotency_key TEXT UNIQUE,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(session_id) REFERENCES credits_balance(session_id)
    );

    CREATE INDEX IF NOT EXISTS idx_credit_transactions_session_created ON credit_transactions(session_id, created_at);
  `);

  dbInstance = db;
  return db;
}

// ===== BALANCE HELPERS =====

function buildBalance(total: number, used: number): CreditsState {
  const remaining = Math.max(0, total - used);
  return { total, used, remaining };
}

function ensureSessionRow(sessionId: string) {
  const db = getDb();
  const existing = db
    .prepare("SELECT session_id FROM credits_balance WHERE session_id = ?")
    .get(sessionId) as { session_id: string } | undefined;

  if (existing) return;

  const now = Date.now();
  db.prepare(
    "INSERT INTO credits_balance (session_id, total, used, created_at, updated_at) VALUES (?, ?, 0, ?, ?)"
  ).run(sessionId, INITIAL_CREDITS, now, now);

  db.prepare(
    "INSERT OR IGNORE INTO credit_transactions (id, session_id, type, amount, source, idempotency_key, created_at) VALUES (?, ?, 'grant', ?, 'initial', ?, ?)"
  ).run(
    crypto.randomUUID(),
    sessionId,
    INITIAL_CREDITS,
    `initial:${sessionId}`,
    now
  );
}

export function getCreditsBalance(sessionId: string): CreditsState {
  ensureSessionRow(sessionId);

  const db = getDb();
  const row = db
    .prepare("SELECT total, used FROM credits_balance WHERE session_id = ?")
    .get(sessionId) as { total: number; used: number } | undefined;

  if (!row) {
    return buildBalance(INITIAL_CREDITS, 0);
  }

  return buildBalance(row.total, row.used);
}

// ===== CREDIT MUTATIONS =====

export function grantCredits(options: {
  sessionId: string;
  amount: number;
  source: string;
  idempotencyKey?: string;
}): CreditsState {
  const db = getDb();
  const now = Date.now();

  const run = db.transaction(() => {
    ensureSessionRow(options.sessionId);

    if (options.idempotencyKey) {
      const existing = db
        .prepare("SELECT id FROM credit_transactions WHERE idempotency_key = ?")
        .get(options.idempotencyKey) as { id: string } | undefined;
      if (existing) {
        return getCreditsBalance(options.sessionId);
      }
    }

    db.prepare(
      "INSERT INTO credit_transactions (id, session_id, type, amount, source, idempotency_key, created_at) VALUES (?, ?, 'grant', ?, ?, ?, ?)"
    ).run(
      crypto.randomUUID(),
      options.sessionId,
      options.amount,
      options.source,
      options.idempotencyKey ?? null,
      now
    );

    db.prepare(
      "UPDATE credits_balance SET total = total + ?, updated_at = ? WHERE session_id = ?"
    ).run(options.amount, now, options.sessionId);

    return getCreditsBalance(options.sessionId);
  });

  return run();
}

export function consumeCredits(options: {
  sessionId: string;
  amount: number;
  source: string;
  idempotencyKey?: string;
}): { ok: boolean; balance: CreditsState; charged: boolean } {
  const db = getDb();
  const now = Date.now();

  const run = db.transaction(() => {
    ensureSessionRow(options.sessionId);

    if (options.idempotencyKey) {
      const existing = db
        .prepare("SELECT id FROM credit_transactions WHERE idempotency_key = ?")
        .get(options.idempotencyKey) as { id: string } | undefined;
      if (existing) {
        return {
          ok: true,
          balance: getCreditsBalance(options.sessionId),
          charged: false,
        };
      }
    }

    const row = db
      .prepare("SELECT total, used FROM credits_balance WHERE session_id = ?")
      .get(options.sessionId) as { total: number; used: number } | undefined;

    if (!row) {
      return { ok: false, balance: buildBalance(INITIAL_CREDITS, 0), charged: false };
    }

    const remaining = row.total - row.used;
    if (remaining < options.amount) {
      return { ok: false, balance: buildBalance(row.total, row.used), charged: false };
    }

    db.prepare(
      "INSERT INTO credit_transactions (id, session_id, type, amount, source, idempotency_key, created_at) VALUES (?, ?, 'use', ?, ?, ?, ?)"
    ).run(
      crypto.randomUUID(),
      options.sessionId,
      options.amount,
      options.source,
      options.idempotencyKey ?? null,
      now
    );

    db.prepare(
      "UPDATE credits_balance SET used = used + ?, updated_at = ? WHERE session_id = ?"
    ).run(options.amount, now, options.sessionId);

    return {
      ok: true,
      balance: getCreditsBalance(options.sessionId),
      charged: true,
    };
  });

  return run();
}

/**
 * Close the database connection.
 */
export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
