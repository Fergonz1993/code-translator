// ===== SECRET ROTATION AUTOMATION =====
// Automated secret rotation and management.

import { randomBytes } from 'crypto';

export interface SecretConfig {
  name: string;
  envVar: string;
  rotationIntervalDays: number;
  lastRotated?: Date;
  nextRotation?: Date;
  generator?: () => string;
}

export interface RotationResult {
  secret: string;
  name: string;
  previousValue?: string;
  rotatedAt: Date;
  expiresAt: Date;
}

/**
 * Default secret generator (32 random bytes as hex).
 */
export function generateSecret(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate a strong API key.
 */
export function generateAPIKey(prefix: string = 'ct'): string {
  const key = randomBytes(24).toString('base64').replace(/[+/=]/g, '');
  return `${prefix}_${key}`;
}

/**
 * Generate a session secret.
 */
export function generateSessionSecret(): string {
  return randomBytes(32).toString('base64');
}

/**
 * Managed secrets configuration.
 */
export const MANAGED_SECRETS: SecretConfig[] = [
  {
    name: 'Session Secret',
    envVar: 'SESSION_SECRET',
    rotationIntervalDays: 90,
    generator: generateSessionSecret,
  },
  {
    name: 'Encryption Key',
    envVar: 'ENCRYPTION_KEY',
    rotationIntervalDays: 180,
    generator: () => generateSecret(32),
  },
  {
    name: 'API Signing Key',
    envVar: 'API_SIGNING_KEY',
    rotationIntervalDays: 30,
    generator: () => generateSecret(64),
  },
];

/**
 * Check if a secret needs rotation.
 */
export function needsRotation(config: SecretConfig): boolean {
  if (!config.lastRotated) return true;
  
  const daysSinceRotation = (Date.now() - config.lastRotated.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceRotation >= config.rotationIntervalDays;
}

/**
 * Get secrets that need rotation.
 */
export function getSecretsNeedingRotation(secrets: SecretConfig[]): SecretConfig[] {
  return secrets.filter(needsRotation);
}

/**
 * Rotate a secret.
 */
export function rotateSecret(config: SecretConfig): RotationResult {
  const generator = config.generator || generateSecret;
  const newSecret = generator();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.rotationIntervalDays * 24 * 60 * 60 * 1000);
  
  // In production, this would:
  // 1. Store new secret in secrets manager
  // 2. Update environment variables
  // 3. Trigger rolling restart if needed
  
  console.log(`[Secret Rotation] Rotated ${config.name}`, {
    envVar: config.envVar,
    rotatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
  
  return {
    secret: newSecret,
    name: config.name,
    rotatedAt: now,
    expiresAt,
  };
}

/**
 * Generate rotation schedule.
 */
export function generateRotationSchedule(secrets: SecretConfig[]): Array<{
  name: string;
  envVar: string;
  lastRotated: Date | null;
  nextRotation: Date;
  daysUntilRotation: number;
  urgent: boolean;
}> {
  const now = Date.now();
  
  return secrets.map(secret => {
    const lastRotated = secret.lastRotated || null;
    const nextRotation = lastRotated 
      ? new Date(lastRotated.getTime() + secret.rotationIntervalDays * 24 * 60 * 60 * 1000)
      : new Date();
    const daysUntilRotation = Math.max(0, Math.ceil((nextRotation.getTime() - now) / (1000 * 60 * 60 * 24)));
    
    return {
      name: secret.name,
      envVar: secret.envVar,
      lastRotated,
      nextRotation,
      daysUntilRotation,
      urgent: daysUntilRotation <= 7,
    };
  }).sort((a, b) => a.daysUntilRotation - b.daysUntilRotation);
}

/**
 * Validate secret strength.
 */
export function validateSecretStrength(secret: string): {
  strong: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 0;
  
  // Length check
  if (secret.length >= 32) score += 25;
  else if (secret.length >= 16) score += 15;
  else issues.push('Secret should be at least 32 characters');
  
  // Character diversity
  if (/[a-z]/.test(secret)) score += 10;
  if (/[A-Z]/.test(secret)) score += 10;
  if (/[0-9]/.test(secret)) score += 10;
  if (/[^a-zA-Z0-9]/.test(secret)) score += 15;
  
  // Entropy estimate
  const uniqueChars = new Set(secret).size;
  if (uniqueChars >= secret.length * 0.5) score += 15;
  else issues.push('Secret has low character diversity');
  
  // Pattern detection
  if (/(.)\1{3,}/.test(secret)) {
    issues.push('Secret contains repeated characters');
    score -= 10;
  }
  if (/^[a-zA-Z]+$/.test(secret)) {
    issues.push('Secret is letters only');
    score -= 10;
  }
  
  return {
    strong: score >= 60 && issues.length === 0,
    score: Math.max(0, Math.min(100, score)),
    issues,
  };
}

/**
 * Generate rotation reminder message.
 */
export function generateRotationReminder(schedule: ReturnType<typeof generateRotationSchedule>): string {
  const urgent = schedule.filter(s => s.urgent);
  const upcoming = schedule.filter(s => !s.urgent && s.daysUntilRotation <= 30);
  
  let message = '# Secret Rotation Status\n\n';
  
  if (urgent.length > 0) {
    message += '## ⚠️ Urgent Rotations Required\n\n';
    for (const s of urgent) {
      message += `- **${s.name}** (${s.envVar}): ${s.daysUntilRotation} days\n`;
    }
    message += '\n';
  }
  
  if (upcoming.length > 0) {
    message += '## 📅 Upcoming Rotations\n\n';
    for (const s of upcoming) {
      message += `- ${s.name} (${s.envVar}): ${s.daysUntilRotation} days\n`;
    }
  }
  
  if (urgent.length === 0 && upcoming.length === 0) {
    message += '✅ All secrets are within rotation schedule.\n';
  }
  
  return message;
}
