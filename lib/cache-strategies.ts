// ===== SERVICE WORKER CACHING STRATEGIES =====
// Advanced caching strategies for service worker.

/**
 * Cache names.
 */
export const CACHE_NAMES = {
  static: 'static-v1',
  dynamic: 'dynamic-v1',
  api: 'api-v1',
  images: 'images-v1',
  fonts: 'fonts-v1',
} as const;

/**
 * Cache expiration times.
 */
export const CACHE_TTL = {
  static: 60 * 60 * 24 * 30, // 30 days
  dynamic: 60 * 60 * 24, // 1 day
  api: 60 * 5, // 5 minutes
  images: 60 * 60 * 24 * 7, // 7 days
  fonts: 60 * 60 * 24 * 365, // 1 year
} as const;

/**
 * Cache-first strategy (for static assets).
 */
export async function cacheFirst(
  request: Request,
  cacheName: string
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  const response = await fetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

/**
 * Network-first strategy (for dynamic content).
 */
export async function networkFirst(
  request: Request,
  cacheName: string,
  timeoutMs: number = 3000
): Promise<Response> {
  const cache = await caches.open(cacheName);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw new Error('Network and cache both failed');
  }
}

/**
 * Stale-while-revalidate strategy.
 */
export async function staleWhileRevalidate(
  request: Request,
  cacheName: string
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  // Return cached immediately if available
  return cached || fetchPromise;
}

/**
 * Network-only strategy (for API calls that must be fresh).
 */
export async function networkOnly(request: Request): Promise<Response> {
  return fetch(request);
}

/**
 * Cache-only strategy (for offline-first).
 */
export async function cacheOnly(
  request: Request,
  cacheName: string
): Promise<Response | undefined> {
  const cache = await caches.open(cacheName);
  return cache.match(request);
}

/**
 * Clean expired cache entries.
 */
export async function cleanExpiredEntries(
  cacheName: string,
  maxAgeSeconds: number
): Promise<number> {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const now = Date.now();
  let cleaned = 0;
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (!response) continue;
    
    const dateHeader = response.headers.get('date');
    if (dateHeader) {
      const cachedTime = new Date(dateHeader).getTime();
      if (now - cachedTime > maxAgeSeconds * 1000) {
        await cache.delete(request);
        cleaned++;
      }
    }
  }
  
  return cleaned;
}

/**
 * Precache list of URLs.
 */
export async function precache(
  urls: string[],
  cacheName: string
): Promise<void> {
  const cache = await caches.open(cacheName);
  await cache.addAll(urls);
}

/**
 * Get cache storage usage.
 */
export async function getCacheUsage(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: estimate.quota 
        ? Math.round((estimate.usage || 0) / estimate.quota * 100) 
        : 0,
    };
  }
  return { usage: 0, quota: 0, percentage: 0 };
}

/**
 * Clear all caches.
 */
export async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}
