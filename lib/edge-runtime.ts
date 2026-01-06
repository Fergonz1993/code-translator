// ===== EDGE FUNCTION CONFIGURATION =====
// Configuration for Edge runtime deployments.

/**
 * Edge runtime configuration for optimal latency.
 */
export const edgeConfig = {
  runtime: 'edge' as const,
  
  // Preferred regions for edge deployment
  regions: ['iad1', 'sfo1', 'cdg1', 'hnd1'] as const,
  
  // Maximum duration for edge functions (seconds)
  maxDuration: 30,
};

/**
 * Check if running in Edge runtime.
 */
export function isEdgeRuntime(): boolean {
  return typeof globalThis !== 'undefined' && 'EdgeRuntime' in globalThis;
}

/**
 * Get the current edge region.
 */
export function getEdgeRegion(): string | undefined {
  // Vercel edge region header
  if (typeof process !== 'undefined' && process.env.VERCEL_REGION) {
    return process.env.VERCEL_REGION;
  }
  return undefined;
}

/**
 * Edge-compatible fetch with timeout.
 */
export async function edgeFetch(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Edge-compatible response helpers.
 */
export const EdgeResponse = {
  json(data: unknown, init?: ResponseInit): Response {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  },
  
  error(message: string, status: number = 500): Response {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  },
  
  stream(readable: ReadableStream, init?: ResponseInit): Response {
    return new Response(readable, {
      ...init,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...init?.headers,
      },
    });
  },
};

/**
 * Edge-compatible cache.
 */
export const EdgeCache = {
  async get(key: string): Promise<string | null> {
    // Use cache API if available
    if (typeof caches !== 'undefined') {
      const cache = await caches.open('edge-cache');
      const response = await cache.match(key);
      if (response) {
        return response.text();
      }
    }
    return null;
  },
  
  async set(key: string, value: string, ttlSeconds: number = 60): Promise<void> {
    if (typeof caches !== 'undefined') {
      const cache = await caches.open('edge-cache');
      const response = new Response(value, {
        headers: {
          'Cache-Control': `max-age=${ttlSeconds}`,
        },
      });
      await cache.put(key, response);
    }
  },
};
