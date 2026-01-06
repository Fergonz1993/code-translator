// ===== IP-BASED RATE LIMITING =====
// Rate limiting by IP address with sliding window.

interface IPRateLimitRecord {
  requests: number[];
  blocked: boolean;
  blockedUntil?: number;
}

const ipRecords = new Map<string, IPRateLimitRecord>();

export interface IPRateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDurationMs: number;
  skipSuccessfulRequests?: boolean;
}

const DEFAULT_CONFIG: IPRateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  blockDurationMs: 15 * 60 * 1000, // 15 minutes
  skipSuccessfulRequests: false,
};

/**
 * Check if an IP is rate limited.
 */
export function checkIPRateLimit(
  ip: string,
  config: Partial<IPRateLimitConfig> = {}
): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const { windowMs, maxRequests, blockDurationMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  
  let record = ipRecords.get(ip);
  
  // Check if blocked
  if (record?.blocked && record.blockedUntil) {
    if (now < record.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: record.blockedUntil - now,
      };
    }
    // Block expired, reset
    record = { requests: [], blocked: false };
  }
  
  if (!record) {
    record = { requests: [], blocked: false };
  }
  
  // Clean old requests outside window
  record.requests = record.requests.filter(time => now - time < windowMs);
  
  // Check rate limit
  if (record.requests.length >= maxRequests) {
    record.blocked = true;
    record.blockedUntil = now + blockDurationMs;
    ipRecords.set(ip, record);
    
    console.warn('[IP Rate Limit] Blocked', {
      ip: ip.slice(0, 8) + '...',
      requests: record.requests.length,
      blockedForMs: blockDurationMs,
    });
    
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: blockDurationMs,
    };
  }
  
  // Allow request
  record.requests.push(now);
  ipRecords.set(ip, record);
  
  return {
    allowed: true,
    remaining: maxRequests - record.requests.length,
  };
}

/**
 * Record a request for an IP.
 */
export function recordIPRequest(ip: string): void {
  checkIPRateLimit(ip); // This adds the request
}

/**
 * Get IP from request headers.
 */
export function getClientIP(headers: Record<string, string | undefined>): string {
  // Check common proxy headers
  const forwardedFor = headers['x-forwarded-for'];
  if (forwardedFor) {
    // Take the first IP (client IP)
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = headers['cf-connecting-ip'];
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

/**
 * Reset rate limit for an IP (admin action).
 */
export function resetIPRateLimit(ip: string): void {
  ipRecords.delete(ip);
}

/**
 * Get all blocked IPs.
 */
export function getBlockedIPs(): Array<{ ip: string; blockedUntil: number }> {
  const blocked: Array<{ ip: string; blockedUntil: number }> = [];
  const now = Date.now();
  
  for (const [ip, record] of ipRecords.entries()) {
    if (record.blocked && record.blockedUntil && record.blockedUntil > now) {
      blocked.push({ ip, blockedUntil: record.blockedUntil });
    }
  }
  
  return blocked;
}

/**
 * Get rate limit headers for response.
 */
export function getRateLimitHeaders(
  remaining: number,
  limit: number,
  retryAfterMs?: number
): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
    'X-RateLimit-Reset': Math.floor((Date.now() + 60000) / 1000).toString(),
  };
  
  if (retryAfterMs) {
    headers['Retry-After'] = Math.ceil(retryAfterMs / 1000).toString();
  }
  
  return headers;
}

/**
 * Cleanup expired records (should be called periodically).
 */
export function cleanupIPRecords(): number {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [ip, record] of ipRecords.entries()) {
    // Remove if all requests are old and not blocked
    const hasRecentRequests = record.requests.some(t => now - t < 300000); // 5 minutes
    const isStillBlocked = record.blocked && record.blockedUntil && record.blockedUntil > now;
    
    if (!hasRecentRequests && !isStillBlocked) {
      ipRecords.delete(ip);
      cleaned++;
    }
  }
  
  return cleaned;
}
