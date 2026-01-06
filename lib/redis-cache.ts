// ===== REDIS CACHING LAYER =====
// Redis cache integration for translations.

export interface CacheConfig {
  url?: string;
  prefix?: string;
  defaultTTL?: number;
}

export interface CacheEntry<T> {
  value: T;
  cachedAt: number;
  ttl: number;
  hits: number;
}

// In-memory fallback when Redis is not available
const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Redis-like cache interface (works with Upstash Redis or memory fallback).
 */
export class TranslationCache {
  private prefix: string;
  private defaultTTL: number;
  private redisUrl?: string;
  
  constructor(config: CacheConfig = {}) {
    this.prefix = config.prefix || 'ct:cache:';
    this.defaultTTL = config.defaultTTL || 3600; // 1 hour
    this.redisUrl = config.url || process.env.REDIS_URL;
  }
  
  /**
   * Generate cache key from translation parameters.
   */
  generateKey(code: string, model: string, language: string): string {
    const hash = this.hashCode(code);
    return `${this.prefix}${model}:${language}:${hash}`;
  }
  
  /**
   * Simple hash function for cache keys.
   */
  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Get cached translation.
   */
  async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (this.redisUrl) {
      try {
        const response = await fetch(`${this.redisUrl}/get/${key}`, {
          headers: { 'Authorization': `Bearer ${process.env.REDIS_TOKEN}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            return JSON.parse(data.result) as T;
          }
        }
      } catch {
        // Fall through to memory cache
      }
    }
    
    // Memory fallback
    const entry = memoryCache.get(key) as CacheEntry<T> | undefined;
    if (entry) {
      const age = Date.now() - entry.cachedAt;
      if (age < entry.ttl * 1000) {
        entry.hits++;
        return entry.value;
      }
      memoryCache.delete(key);
    }
    
    return null;
  }
  
  /**
   * Set cached translation.
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const actualTTL = ttl || this.defaultTTL;
    
    // Try Redis first
    if (this.redisUrl) {
      try {
        await fetch(`${this.redisUrl}/set/${key}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REDIS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: JSON.stringify(value),
            ex: actualTTL,
          }),
        });
        return;
      } catch {
        // Fall through to memory cache
      }
    }
    
    // Memory fallback
    memoryCache.set(key, {
      value,
      cachedAt: Date.now(),
      ttl: actualTTL,
      hits: 0,
    });
  }
  
  /**
   * Delete from cache.
   */
  async delete(key: string): Promise<void> {
    if (this.redisUrl) {
      try {
        await fetch(`${this.redisUrl}/del/${key}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.REDIS_TOKEN}` },
        });
      } catch {
        // Ignore errors
      }
    }
    memoryCache.delete(key);
  }
  
  /**
   * Clear all cache entries with prefix.
   */
  async clear(): Promise<void> {
    // Memory cache clear
    for (const key of memoryCache.keys()) {
      if (key.startsWith(this.prefix)) {
        memoryCache.delete(key);
      }
    }
  }
  
  /**
   * Get cache statistics.
   */
  getStats(): { size: number; hits: number; totalTTL: number } {
    let hits = 0;
    let totalTTL = 0;
    
    for (const entry of memoryCache.values()) {
      hits += (entry as CacheEntry<unknown>).hits;
      totalTTL += (entry as CacheEntry<unknown>).ttl;
    }
    
    return {
      size: memoryCache.size,
      hits,
      totalTTL,
    };
  }
}

// Singleton instance
export const translationCache = new TranslationCache();
