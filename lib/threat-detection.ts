// ===== SUSPICIOUS ACTIVITY DETECTION =====
// Detect and block suspicious activity patterns.

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export interface SuspiciousActivity {
  type: string;
  description: string;
  level: ThreatLevel;
  timestamp: number;
  metadata: Record<string, unknown>;
}

export interface ActivityProfile {
  identifier: string;
  activities: SuspiciousActivity[];
  score: number;
  blocked: boolean;
  blockedUntil?: number;
  firstSeen: number;
  lastSeen: number;
}

const profiles = new Map<string, ActivityProfile>();

/**
 * Threat scoring weights.
 */
const THREAT_SCORES: Record<ThreatLevel, number> = {
  low: 1,
  medium: 5,
  high: 15,
  critical: 50,
};

/**
 * Blocking thresholds.
 */
const BLOCK_THRESHOLDS = {
  warning: 10,
  softBlock: 25,
  hardBlock: 50,
};

/**
 * Suspicious patterns to detect.
 */
export const DETECTION_RULES: Array<{
  name: string;
  check: (request: DetectionContext) => boolean;
  level: ThreatLevel;
  description: string;
}> = [
  {
    name: 'rapid-fire',
    check: (ctx) => ctx.requestsPerSecond > 10,
    level: 'high',
    description: 'Abnormally high request rate',
  },
  {
    name: 'invalid-input-flood',
    check: (ctx) => ctx.invalidInputCount > 5,
    level: 'medium',
    description: 'Multiple invalid input attempts',
  },
  {
    name: 'auth-bruteforce',
    check: (ctx) => ctx.authFailures > 3,
    level: 'high',
    description: 'Multiple authentication failures',
  },
  {
    name: 'scanner-pattern',
    check: (ctx) => ctx.scannerHeaders,
    level: 'medium',
    description: 'Request matches scanner/bot patterns',
  },
  {
    name: 'injection-attempt',
    check: (ctx) => ctx.injectionAttempt,
    level: 'critical',
    description: 'Possible injection attack detected',
  },
  {
    name: 'unusual-useragent',
    check: (ctx) => !ctx.userAgent || ctx.userAgent.length > 500,
    level: 'low',
    description: 'Missing or unusual User-Agent',
  },
  {
    name: 'path-traversal',
    check: (ctx) => ctx.pathTraversal,
    level: 'critical',
    description: 'Path traversal attempt',
  },
];

export interface DetectionContext {
  identifier: string;
  ip: string;
  userAgent?: string;
  requestsPerSecond: number;
  invalidInputCount: number;
  authFailures: number;
  scannerHeaders: boolean;
  injectionAttempt: boolean;
  pathTraversal: boolean;
  endpoint: string;
  method: string;
}

/**
 * Analyze request for suspicious activity.
 */
export function analyzeRequest(context: DetectionContext): SuspiciousActivity[] {
  const activities: SuspiciousActivity[] = [];
  
  for (const rule of DETECTION_RULES) {
    if (rule.check(context)) {
      activities.push({
        type: rule.name,
        description: rule.description,
        level: rule.level,
        timestamp: Date.now(),
        metadata: {
          ip: context.ip,
          endpoint: context.endpoint,
          method: context.method,
        },
      });
    }
  }
  
  return activities;
}

/**
 * Record suspicious activity for an identifier.
 */
export function recordSuspiciousActivity(
  identifier: string,
  activities: SuspiciousActivity[]
): ActivityProfile {
  const now = Date.now();
  let profile = profiles.get(identifier);
  
  if (!profile) {
    profile = {
      identifier,
      activities: [],
      score: 0,
      blocked: false,
      firstSeen: now,
      lastSeen: now,
    };
  }
  
  // Add new activities
  profile.activities.push(...activities);
  profile.lastSeen = now;
  
  // Calculate score (decay old activities)
  profile.score = profile.activities.reduce((score, activity) => {
    const age = now - activity.timestamp;
    const decay = Math.exp(-age / (60 * 60 * 1000)); // 1 hour half-life
    return score + THREAT_SCORES[activity.level] * decay;
  }, 0);
  
  // Check blocking thresholds
  if (profile.score >= BLOCK_THRESHOLDS.hardBlock) {
    profile.blocked = true;
    profile.blockedUntil = now + 24 * 60 * 60 * 1000; // 24 hours
    console.error('[Security] Hard block triggered', { identifier, score: profile.score });
  } else if (profile.score >= BLOCK_THRESHOLDS.softBlock) {
    profile.blocked = true;
    profile.blockedUntil = now + 60 * 60 * 1000; // 1 hour
    console.warn('[Security] Soft block triggered', { identifier, score: profile.score });
  }
  
  profiles.set(identifier, profile);
  return profile;
}

/**
 * Check if an identifier is blocked.
 */
export function isBlocked(identifier: string): { blocked: boolean; reason?: string; until?: number } {
  const profile = profiles.get(identifier);
  
  if (!profile?.blocked) {
    return { blocked: false };
  }
  
  if (profile.blockedUntil && Date.now() > profile.blockedUntil) {
    profile.blocked = false;
    profiles.set(identifier, profile);
    return { blocked: false };
  }
  
  return {
    blocked: true,
    reason: 'Suspicious activity detected',
    until: profile.blockedUntil,
  };
}

/**
 * Get threat summary for identifier.
 */
export function getThreatSummary(identifier: string): {
  score: number;
  level: ThreatLevel;
  recentActivities: SuspiciousActivity[];
} {
  const profile = profiles.get(identifier);
  
  if (!profile) {
    return { score: 0, level: 'low', recentActivities: [] };
  }
  
  const now = Date.now();
  const recentActivities = profile.activities.filter(
    a => now - a.timestamp < 60 * 60 * 1000 // Last hour
  );
  
  let level: ThreatLevel = 'low';
  if (profile.score >= BLOCK_THRESHOLDS.hardBlock) level = 'critical';
  else if (profile.score >= BLOCK_THRESHOLDS.softBlock) level = 'high';
  else if (profile.score >= BLOCK_THRESHOLDS.warning) level = 'medium';
  
  return {
    score: Math.round(profile.score * 100) / 100,
    level,
    recentActivities,
  };
}

/**
 * Clear profile (admin action).
 */
export function clearProfile(identifier: string): void {
  profiles.delete(identifier);
}

/**
 * Cleanup old profiles.
 */
export function cleanupProfiles(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [id, profile] of profiles.entries()) {
    if (now - profile.lastSeen > maxAgeMs && !profile.blocked) {
      profiles.delete(id);
      cleaned++;
    }
  }
  
  return cleaned;
}
