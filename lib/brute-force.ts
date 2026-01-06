// ===== BRUTE FORCE PROTECTION =====
// Rate limiting and lockout for API key validation attempts.

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
}

const attempts = new Map<string, AttemptRecord>();

export interface BruteForceConfig {
  maxAttempts: number;
  windowMs: number;
  lockoutMs: number;
  keyPrefix?: string;
}

const DEFAULT_CONFIG: BruteForceConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutMs: 60 * 60 * 1000, // 1 hour lockout
  keyPrefix: 'bf',
};

/**
 * Check if an identifier is currently locked out.
 */
export function isLockedOut(
  identifier: string,
  config: Partial<BruteForceConfig> = {}
): { locked: boolean; remainingMs?: number; attempts?: number } {
  const { keyPrefix } = { ...DEFAULT_CONFIG, ...config };
  const key = `${keyPrefix}:${identifier}`;
  const record = attempts.get(key);
  
  if (!record) {
    return { locked: false, attempts: 0 };
  }
  
  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    return {
      locked: true,
      remainingMs: record.lockedUntil - Date.now(),
      attempts: record.count,
    };
  }
  
  return { locked: false, attempts: record.count };
}

/**
 * Record a failed attempt and check if lockout should be triggered.
 */
export function recordFailedAttempt(
  identifier: string,
  config: Partial<BruteForceConfig> = {}
): { locked: boolean; remainingAttempts: number } {
  const { maxAttempts, windowMs, lockoutMs, keyPrefix } = { ...DEFAULT_CONFIG, ...config };
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();
  
  let record = attempts.get(key);
  
  if (!record || now - record.firstAttempt > windowMs) {
    // Start fresh window
    record = { count: 1, firstAttempt: now, lastAttempt: now };
  } else {
    record.count++;
    record.lastAttempt = now;
  }
  
  if (record.count >= maxAttempts) {
    record.lockedUntil = now + lockoutMs;
    attempts.set(key, record);
    
    console.warn('[Brute Force] Lockout triggered', {
      identifier: identifier.slice(0, 8) + '...',
      attempts: record.count,
      lockedUntilMs: lockoutMs,
    });
    
    return { locked: true, remainingAttempts: 0 };
  }
  
  attempts.set(key, record);
  return { locked: false, remainingAttempts: maxAttempts - record.count };
}

/**
 * Record a successful attempt (clears the record).
 */
export function recordSuccessfulAttempt(
  identifier: string,
  config: Partial<BruteForceConfig> = {}
): void {
  const { keyPrefix } = { ...DEFAULT_CONFIG, ...config };
  const key = `${keyPrefix}:${identifier}`;
  attempts.delete(key);
}

/**
 * Clear lockout for an identifier (admin action).
 */
export function clearLockout(
  identifier: string,
  config: Partial<BruteForceConfig> = {}
): void {
  const { keyPrefix } = { ...DEFAULT_CONFIG, ...config };
  const key = `${keyPrefix}:${identifier}`;
  attempts.delete(key);
}

/**
 * Get all currently locked identifiers (for monitoring).
 */
export function getLockedIdentifiers(): Array<{
  identifier: string;
  lockedUntil: number;
  attempts: number;
}> {
  const now = Date.now();
  const locked: Array<{ identifier: string; lockedUntil: number; attempts: number }> = [];
  
  for (const [key, record] of attempts.entries()) {
    if (record.lockedUntil && record.lockedUntil > now) {
      locked.push({
        identifier: key,
        lockedUntil: record.lockedUntil,
        attempts: record.count,
      });
    }
  }
  
  return locked;
}

/**
 * Cleanup expired records (should be called periodically).
 */
export function cleanupExpiredRecords(
  config: Partial<BruteForceConfig> = {}
): number {
  const { windowMs, lockoutMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, record] of attempts.entries()) {
    const expired = record.lockedUntil
      ? record.lockedUntil < now
      : now - record.lastAttempt > windowMs + lockoutMs;
      
    if (expired) {
      attempts.delete(key);
      cleaned++;
    }
  }
  
  return cleaned;
}
