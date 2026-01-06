// ===== CDN EDGE CACHING =====
// CDN cache configuration for static assets.

/**
 * Cache control headers for different asset types.
 */
export const cacheHeaders = {
  // Immutable static assets (hashed filenames)
  immutable: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'CDN-Cache-Control': 'public, max-age=31536000',
    'Vercel-CDN-Cache-Control': 'public, max-age=31536000',
  },
  
  // Static assets that may change
  static: {
    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    'CDN-Cache-Control': 'public, max-age=604800',
  },
  
  // HTML pages (short cache, frequent revalidation)
  page: {
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'CDN-Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
  },
  
  // API responses (short cache)
  api: {
    'Cache-Control': 'private, max-age=0, must-revalidate',
    'CDN-Cache-Control': 'private, no-store',
  },
  
  // Translations (cacheable with validation)
  translation: {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
    'CDN-Cache-Control': 'public, max-age=3600',
  },
};

/**
 * Surrogate keys for targeted cache invalidation.
 */
export function generateSurrogateKeys(
  type: 'page' | 'translation' | 'user',
  ids: string[]
): string {
  return ids.map(id => `${type}:${id}`).join(' ');
}

/**
 * Cache tags for Vercel.
 */
export function getVercelCacheTags(tags: string[]): Record<string, string> {
  return {
    'x-vercel-cache-tags': tags.join(','),
  };
}

/**
 * Cloudflare cache configuration.
 */
export const cloudflareCacheConfig = {
  // Cache everything including HTML
  cacheEverything: false,
  
  // Respect origin cache headers
  respectOriginHeaders: true,
  
  // Edge cache TTL
  edgeTTL: 86400,
  
  // Browser cache TTL
  browserTTL: 3600,
  
  // Bypass cache for these paths
  bypassPaths: [
    '/api/*',
    '/checkout/*',
  ],
};

/**
 * Generate cache key for translations.
 */
export function generateTranslationCacheKey(
  code: string,
  model: string,
  language: string
): string {
  const hash = simpleHash(code);
  return `translation:${model}:${language}:${hash}`;
}

/**
 * Simple hash function for cache keys.
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Cache purge helper.
 */
export async function purgeCache(
  purgeUrl: string,
  type: 'url' | 'tag' | 'all',
  value?: string
): Promise<boolean> {
  try {
    const body = type === 'all' 
      ? { purge_everything: true }
      : type === 'tag'
        ? { tags: [value] }
        : { files: [value] };
    
    const response = await fetch(purgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CDN_API_TOKEN}`,
      },
      body: JSON.stringify(body),
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Next.js headers configuration for CDN caching.
 */
export const nextCacheHeaders = {
  headers: async () => [
    {
      source: '/_next/static/:path*',
      headers: Object.entries(cacheHeaders.immutable).map(([key, value]) => ({
        key,
        value,
      })),
    },
    {
      source: '/fonts/:path*',
      headers: Object.entries(cacheHeaders.immutable).map(([key, value]) => ({
        key,
        value,
      })),
    },
    {
      source: '/images/:path*',
      headers: Object.entries(cacheHeaders.static).map(([key, value]) => ({
        key,
        value,
      })),
    },
  ],
};
