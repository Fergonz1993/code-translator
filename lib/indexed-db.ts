// ===== ENHANCED INDEXEDDB CACHE =====
// Advanced IndexedDB caching with better performance.

export interface CachedItem<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
  size?: number;
}

const DB_NAME = 'code-translator-cache';
const DB_VERSION = 2;
const STORES = {
  translations: 'translations',
  history: 'history',
  settings: 'settings',
  offline: 'offline',
};

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Open IndexedDB connection.
 */
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores
      for (const storeName of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('tags', 'tags', { multiEntry: true });
        }
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  return dbPromise;
}

/**
 * Get item from cache.
 */
export async function idbGet<T>(
  store: keyof typeof STORES,
  key: string
): Promise<T | null> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[store], 'readonly');
    const request = tx.objectStore(STORES[store]).get(key);
    
    request.onsuccess = () => {
      const item = request.result as CachedItem<T> | undefined;
      
      if (!item) {
        resolve(null);
        return;
      }
      
      // Check expiration
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        // Expired, delete asynchronously
        idbDelete(store, key).catch(() => {});
        resolve(null);
        return;
      }
      
      resolve(item.value);
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Set item in cache.
 */
export async function idbSet<T>(
  store: keyof typeof STORES,
  key: string,
  value: T,
  options: { ttl?: number; tags?: string[] } = {}
): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[store], 'readwrite');
    
    const item: CachedItem<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: options.ttl || 0,
      tags: options.tags,
      size: JSON.stringify(value).length,
    };
    
    const request = tx.objectStore(STORES[store]).put(item);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete item from cache.
 */
export async function idbDelete(
  store: keyof typeof STORES,
  key: string
): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[store], 'readwrite');
    const request = tx.objectStore(STORES[store]).delete(key);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete items by tag.
 */
export async function idbDeleteByTag(
  store: keyof typeof STORES,
  tag: string
): Promise<number> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[store], 'readwrite');
    const index = tx.objectStore(STORES[store]).index('tags');
    const request = index.openCursor(IDBKeyRange.only(tag));
    let deleted = 0;
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        deleted++;
        cursor.continue();
      } else {
        resolve(deleted);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear expired items.
 */
export async function idbClearExpired(
  store: keyof typeof STORES
): Promise<number> {
  const db = await openDB();
  const now = Date.now();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES[store], 'readwrite');
    const objStore = tx.objectStore(STORES[store]);
    const request = objStore.openCursor();
    let deleted = 0;
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const item = cursor.value as CachedItem<unknown>;
        if (item.ttl && now - item.timestamp > item.ttl) {
          cursor.delete();
          deleted++;
        }
        cursor.continue();
      } else {
        resolve(deleted);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get cache storage usage.
 */
export async function idbGetUsage(): Promise<{ used: number; items: number }> {
  const db = await openDB();
  let used = 0;
  let items = 0;
  
  for (const storeName of Object.values(STORES)) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const item = cursor.value as CachedItem<unknown>;
          used += item.size || 0;
          items++;
          cursor.continue();
        } else {
          resolve();
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  return { used, items };
}

/**
 * Clear all caches.
 */
export async function idbClearAll(): Promise<void> {
  const db = await openDB();
  
  const promises = Object.values(STORES).map(storeName =>
    new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const request = tx.objectStore(storeName).clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    })
  );
  
  await Promise.all(promises);
}
