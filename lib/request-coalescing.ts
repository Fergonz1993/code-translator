// ===== REQUEST COALESCING =====
// Coalesce duplicate concurrent requests into a single request.

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  subscribers: number;
}

const pendingRequests = new Map<string, PendingRequest<unknown>>();

/**
 * Configuration for request coalescing.
 */
export interface CoalesceConfig {
  /**
   * Time window in ms to coalesce duplicate requests.
   */
  windowMs?: number;
  /**
   * Maximum age of a pending request before forcing a new one.
   */
  maxAgeMs?: number;
}

const DEFAULT_CONFIG: Required<CoalesceConfig> = {
  windowMs: 100,
  maxAgeMs: 5000,
};

/**
 * Generate a cache key for a request.
 */
export function generateRequestKey(
  url: string,
  options: RequestInit = {}
): string {
  const method = options.method || 'GET';
  const body = typeof options.body === 'string' ? options.body : '';
  return `${method}:${url}:${body}`;
}

/**
 * Coalesce duplicate concurrent requests.
 * Multiple calls with the same key within the window will share a single request.
 */
export async function coalesceRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  config: CoalesceConfig = {}
): Promise<T> {
  const { windowMs, maxAgeMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  
  // Check for existing pending request
  const pending = pendingRequests.get(key) as PendingRequest<T> | undefined;
  
  if (pending) {
    const age = now - pending.timestamp;
    
    // Reuse if within window and not too old
    if (age < maxAgeMs) {
      pending.subscribers++;
      return pending.promise;
    }
    
    // Otherwise, let it finish but don't wait for it
    pendingRequests.delete(key);
  }
  
  // Create new request
  const promise = requestFn().finally(() => {
    // Clean up after request completes
    setTimeout(() => {
      const current = pendingRequests.get(key);
      if (current && current.promise === promise) {
        pendingRequests.delete(key);
      }
    }, windowMs);
  });
  
  pendingRequests.set(key, {
    promise,
    timestamp: now,
    subscribers: 1,
  });
  
  return promise;
}

/**
 * Coalesced fetch wrapper.
 */
export async function coalescedFetch<T>(
  url: string,
  options: RequestInit = {},
  config: CoalesceConfig = {}
): Promise<T> {
  const key = generateRequestKey(url, options);
  
  return coalesceRequest(key, async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }, config);
}

/**
 * Get coalescing statistics.
 */
export function getCoalesceStats(): {
  pendingCount: number;
  totalSubscribers: number;
  oldestPendingMs: number;
} {
  let totalSubscribers = 0;
  let oldestPendingMs = 0;
  const now = Date.now();
  
  for (const pending of pendingRequests.values()) {
    totalSubscribers += pending.subscribers;
    const age = now - pending.timestamp;
    if (age > oldestPendingMs) {
      oldestPendingMs = age;
    }
  }
  
  return {
    pendingCount: pendingRequests.size,
    totalSubscribers,
    oldestPendingMs,
  };
}

/**
 * Clear all pending requests (for testing).
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
}

/**
 * Higher-order function to add coalescing to any async function.
 */
export function withCoalescing<Args extends unknown[], T>(
  fn: (...args: Args) => Promise<T>,
  keyFn: (...args: Args) => string,
  config: CoalesceConfig = {}
): (...args: Args) => Promise<T> {
  return (...args: Args) => {
    const key = keyFn(...args);
    return coalesceRequest(key, () => fn(...args), config);
  };
}
