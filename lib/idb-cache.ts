// ===== INDEXED DB CACHE =====
// Persistent translation caching using IndexedDB.

const DB_NAME = "code-translator-cache";
const DB_VERSION = 1;
const STORE_NAME = "translations";

interface CachedTranslation {
    key: string;
    translations: Array<{ lineNumber: number; line: string; english: string }>;
    timestamp: number;
}

let dbInstance: IDBDatabase | null = null;

async function getDb(): Promise<IDBDatabase> {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
                store.createIndex("timestamp", "timestamp", { unique: false });
            }
        };
    });
}

/**
 * Build a cache key from translation parameters.
 */
export function buildCacheKey(code: string, language: string, model: string): string {
    // Use a hash of the code to avoid very long keys
    const codeHash = hashCode(code);
    return `${model}:${language}:${codeHash}`;
}

function hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

/**
 * Get cached translation if available and not expired.
 */
export async function getCached(
    code: string,
    language: string,
    model: string,
    maxAgeMs: number = 24 * 60 * 60 * 1000 // 24 hours default
): Promise<CachedTranslation | null> {
    try {
        const db = await getDb();
        const key = buildCacheKey(code, language, model);

        return new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);

            request.onsuccess = () => {
                const result = request.result as CachedTranslation | undefined;

                if (!result) {
                    resolve(null);
                    return;
                }

                // Check if expired
                if (Date.now() - result.timestamp > maxAgeMs) {
                    resolve(null);
                    return;
                }

                resolve(result);
            };

            request.onerror = () => resolve(null);
        });
    } catch {
        return null;
    }
}

/**
 * Store translation in cache.
 */
export async function setCache(
    code: string,
    language: string,
    model: string,
    translations: Array<{ lineNumber: number; line: string; english: string }>
): Promise<void> {
    try {
        const db = await getDb();
        const key = buildCacheKey(code, language, model);

        const entry: CachedTranslation = {
            key,
            translations,
            timestamp: Date.now(),
        };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(entry);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch {
        // Silently fail - cache is optional
    }
}

/**
 * Clear expired entries from cache.
 */
export async function clearExpired(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
        const db = await getDb();
        const cutoff = Date.now() - maxAgeMs;

        return new Promise((resolve) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const index = store.index("timestamp");
            const range = IDBKeyRange.upperBound(cutoff);
            const request = index.openCursor(range);

            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };

            request.onerror = () => resolve();
        });
    } catch {
        // Silently fail
    }
}
