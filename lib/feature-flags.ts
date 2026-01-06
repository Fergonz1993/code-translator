// ===== FEATURE FLAGS =====
// Simple feature flag system for gradual rollouts.

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  percentage?: number; // For gradual rollout (0-100)
  allowedSessions?: string[]; // Whitelist specific sessions
}

// Feature flag definitions
const featureFlags: Record<string, FeatureFlag> = {
  streaming_responses: {
    name: "Streaming Responses",
    enabled: false,
    percentage: 0,
  },
  new_onboarding: {
    name: "New Onboarding Flow",
    enabled: true,
    percentage: 100,
  },
  virtual_scrolling: {
    name: "Virtual Scrolling",
    enabled: false,
    percentage: 50,
  },
  translation_feedback: {
    name: "Translation Feedback",
    enabled: true,
    percentage: 100,
  },
  share_translations: {
    name: "Share Translations",
    enabled: true,
    percentage: 100,
  },
  offline_mode: {
    name: "Offline Mode",
    enabled: false,
    percentage: 0,
  },
};

/**
 * Get a consistent hash for a session ID (for percentage rollouts).
 */
function getSessionHash(sessionId: string): number {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    const char = sessionId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 100;
}

/**
 * Check if a feature is enabled for a session.
 */
export function isFeatureEnabled(featureName: string, sessionId?: string): boolean {
  const flag = featureFlags[featureName];
  if (!flag) return false;
  if (!flag.enabled) return false;

  // Check whitelist first
  if (flag.allowedSessions?.includes(sessionId || "")) {
    return true;
  }

  // Check percentage rollout
  if (flag.percentage !== undefined && flag.percentage < 100 && sessionId) {
    const hash = getSessionHash(sessionId);
    return hash < flag.percentage;
  }

  return true;
}

/**
 * Get all feature flags for debugging.
 */
export function getAllFeatureFlags(): Record<string, FeatureFlag> {
  return { ...featureFlags };
}

/**
 * React hook for feature flags (client-side).
 */
export function useFeatureFlag(featureName: string, sessionId?: string): boolean {
  return isFeatureEnabled(featureName, sessionId);
}
