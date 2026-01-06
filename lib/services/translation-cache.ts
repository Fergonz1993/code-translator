// ===== TRANSLATION CACHE SERVICE =====
// Caches translation results to reduce API calls and costs.
// Uses SHA-256 hash of code + language + model as cache key.

import crypto from "crypto";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { TranslatedLine } from "@/lib/types";
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS, SQLITE_BUSY_TIMEOUT_MS } from "@/lib/constants";

// ===== DATABASE SETUP =====

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "cache.sqlite");

function resolveDbPath(): string {
    return process.env.CACHE_DB_PATH || DEFAULT_DB_PATH;
}

function getBusyTimeoutMs(): number {
    const raw = process.env.SQLITE_BUSY_TIMEOUT_MS;
    if (!raw) return SQLITE_BUSY_TIMEOUT_MS;

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return SQLITE_BUSY_TIMEOUT_MS;

    return Math.max(0, Math.floor(parsed));
}

// Cache TTL: 24 hours by default
const DEFAULT_TTL_MS = CACHE_TTL_MS;

let dbInstance: Database.Database | null = null;

type MemoryCacheEntry = {
    translations: TranslatedLine[];
    cachedAt: number;
    expiresAt: number;
    hitCount: number;
};

const memoryCache = new Map<string, MemoryCacheEntry>();

function getLruMaxEntries(): number {
    const raw = process.env.CACHE_LRU_MAX_ENTRIES;
    if (!raw) return CACHE_MAX_ENTRIES;

    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return CACHE_MAX_ENTRIES;

    return Math.max(0, Math.floor(parsed));
}

function isMemoryCacheEnabled(): boolean {
    return getLruMaxEntries() > 0;
}

function touchMemoryEntry(hash: string, entry: MemoryCacheEntry) {
    memoryCache.delete(hash);
    memoryCache.set(hash, entry);
}

function enforceMemoryLimit(maxEntries: number) {
    while (memoryCache.size > maxEntries) {
        const oldestKey = memoryCache.keys().next().value as string | undefined;
        if (!oldestKey) break;
        memoryCache.delete(oldestKey);
    }
}

function getMemoryEntry(hash: string, now: number): MemoryCacheEntry | null {
    if (!isMemoryCacheEnabled()) return null;

    const entry = memoryCache.get(hash);
    if (!entry) return null;

    if (entry.expiresAt <= now) {
        memoryCache.delete(hash);
        return null;
    }

    entry.hitCount += 1;
    touchMemoryEntry(hash, entry);
    return entry;
}

function setMemoryEntry(hash: string, entry: MemoryCacheEntry) {
    if (!isMemoryCacheEnabled()) return;

    touchMemoryEntry(hash, entry);
    enforceMemoryLimit(getLruMaxEntries());
}

function evictExpiredMemoryEntries(now: number) {
    if (memoryCache.size === 0) return;

    for (const [hash, entry] of memoryCache.entries()) {
        if (entry.expiresAt <= now) {
            memoryCache.delete(hash);
        }
    }
}

function getDb(): Database.Database {
    if (dbInstance) return dbInstance;

    const dbPath = resolveDbPath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma(`busy_timeout = ${getBusyTimeoutMs()}`);

    db.exec(`
    CREATE TABLE IF NOT EXISTS translation_cache (
      hash TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      language TEXT NOT NULL,
      model TEXT NOT NULL,
      translations TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      hit_count INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_expires_at ON translation_cache(expires_at);
  `);

    dbInstance = db;
    return db;
}

// ===== CACHE KEY GENERATION =====

export function generateCacheKey(options: {
    code: string;
    language: string;
    model: string;
}): string {
    const content = JSON.stringify({
        code: options.code,
        language: options.language.toLowerCase().trim(),
        model: options.model,
    });

    return crypto.createHash("sha256").update(content).digest("hex");
}

// ===== CACHE OPERATIONS =====

export interface CachedTranslation {
    translations: TranslatedLine[];
    cachedAt: number;
    hitCount: number;
}

function incrementDbHitCount(db: Database.Database, hash: string, now: number) {
    db.prepare(`
    UPDATE translation_cache
    SET hit_count = hit_count + 1
    WHERE hash = ? AND expires_at > ?
  `).run(hash, now);
}

/**
 * Get cached translations if they exist and haven't expired.
 */
export function getCachedTranslation(options: {
    code: string;
    language: string;
    model: string;
}): CachedTranslation | null {
    const hash = generateCacheKey(options);
    const now = Date.now();

    const memoryEntry = getMemoryEntry(hash, now);
    if (memoryEntry) {
        const db = getDb();
        incrementDbHitCount(db, hash, now);
        return {
            translations: memoryEntry.translations,
            cachedAt: memoryEntry.cachedAt,
            hitCount: memoryEntry.hitCount,
        };
    }

    const db = getDb();
    const row = db
        .prepare(`
      SELECT translations, created_at, expires_at, hit_count
      FROM translation_cache 
      WHERE hash = ? AND expires_at > ?
    `)
        .get(hash, now) as {
            translations: string;
            created_at: number;
            expires_at: number;
            hit_count: number;
        } | undefined;

    if (!row) return null;

    // Increment hit count
    incrementDbHitCount(db, hash, now);

    try {
        const translations = JSON.parse(row.translations) as TranslatedLine[];
        const hitCount = row.hit_count + 1;
        setMemoryEntry(hash, {
            translations,
            cachedAt: row.created_at,
            expiresAt: row.expires_at,
            hitCount,
        });
        return {
            translations,
            cachedAt: row.created_at,
            hitCount,
        };
    } catch {
        // Invalid JSON, delete the corrupt entry
        db.prepare("DELETE FROM translation_cache WHERE hash = ?").run(hash);
        return null;
    }
}

/**
 * Store translations in cache.
 */
export function setCachedTranslation(options: {
    code: string;
    language: string;
    model: string;
    translations: TranslatedLine[];
    ttlMs?: number;
}): void {
    const db = getDb();
    const hash = generateCacheKey(options);
    const now = Date.now();
    const ttl = options.ttlMs ?? DEFAULT_TTL_MS;
    const expiresAt = now + ttl;

    db.prepare(`
    INSERT OR REPLACE INTO translation_cache 
    (hash, code, language, model, translations, created_at, expires_at, hit_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `).run(
        hash,
        options.code,
        options.language,
        options.model,
        JSON.stringify(options.translations),
        now,
        expiresAt
    );

    setMemoryEntry(hash, {
        translations: options.translations,
        cachedAt: now,
        expiresAt,
        hitCount: 0,
    });
}

/**
 * Clean up expired cache entries.
 */
export function cleanExpiredCache(): number {
    const db = getDb();
    const now = Date.now();

    evictExpiredMemoryEntries(now);
    const result = db.prepare(`
    DELETE FROM translation_cache WHERE expires_at < ?
  `).run(now);

    return result.changes;
}

/**
 * Get cache statistics.
 */
export function getCacheStats(): {
    totalEntries: number;
    totalHits: number;
    oldestEntry: number | null;
    newestEntry: number | null;
} {
    const db = getDb();

    const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_entries,
      COALESCE(SUM(hit_count), 0) as total_hits,
      MIN(created_at) as oldest_entry,
      MAX(created_at) as newest_entry
    FROM translation_cache
    WHERE expires_at > ?
  `).get(Date.now()) as {
        total_entries: number;
        total_hits: number;
        oldest_entry: number | null;
        newest_entry: number | null;
    };

    return {
        totalEntries: stats.total_entries,
        totalHits: stats.total_hits,
        oldestEntry: stats.oldest_entry,
        newestEntry: stats.newest_entry,
    };
}

/**
 * Clear all cache entries.
 */
export function clearCache(): number {
    memoryCache.clear();
    const db = getDb();
    const result = db.prepare("DELETE FROM translation_cache").run();
    return result.changes;
}

// Exposed for tests and diagnostics.
export function getMemoryCacheStats(): { entries: number; keys: string[] } {
    return { entries: memoryCache.size, keys: Array.from(memoryCache.keys()) };
}

/**
 * Close the database connection.
 */
export function closeDb(): void {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
    memoryCache.clear();
}
