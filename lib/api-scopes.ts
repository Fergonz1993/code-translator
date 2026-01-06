// ===== API KEY SCOPING =====
// Scope-based API key permissions.

export type APIScope = 
  | 'translate:read'
  | 'translate:write'
  | 'credits:read'
  | 'credits:write'
  | 'history:read'
  | 'history:write'
  | 'settings:read'
  | 'settings:write'
  | 'admin:read'
  | 'admin:write';

export interface ScopedAPIKey {
  id: string;
  keyHash: string;
  scopes: APIScope[];
  name?: string;
  createdAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  rateLimit?: number;
  ipWhitelist?: string[];
}

/**
 * Scope categories and their permissions.
 */
export const SCOPE_HIERARCHY: Record<string, APIScope[]> = {
  'read-only': ['translate:read', 'credits:read', 'history:read', 'settings:read'],
  'standard': ['translate:read', 'translate:write', 'credits:read', 'history:read', 'history:write'],
  'full': ['translate:read', 'translate:write', 'credits:read', 'credits:write', 'history:read', 'history:write', 'settings:read', 'settings:write'],
  'admin': ['translate:read', 'translate:write', 'credits:read', 'credits:write', 'history:read', 'history:write', 'settings:read', 'settings:write', 'admin:read', 'admin:write'],
};

/**
 * Check if a key has a specific scope.
 */
export function hasScope(key: ScopedAPIKey, scope: APIScope): boolean {
  return key.scopes.includes(scope);
}

/**
 * Check if a key has all required scopes.
 */
export function hasAllScopes(key: ScopedAPIKey, scopes: APIScope[]): boolean {
  return scopes.every(scope => key.scopes.includes(scope));
}

/**
 * Check if a key has any of the specified scopes.
 */
export function hasAnyScope(key: ScopedAPIKey, scopes: APIScope[]): boolean {
  return scopes.some(scope => key.scopes.includes(scope));
}

/**
 * Get scopes for a preset.
 */
export function getScopesForPreset(preset: keyof typeof SCOPE_HIERARCHY): APIScope[] {
  return SCOPE_HIERARCHY[preset] || [];
}

/**
 * Validate scope string.
 */
export function isValidScope(scope: string): scope is APIScope {
  const validScopes: APIScope[] = [
    'translate:read', 'translate:write',
    'credits:read', 'credits:write',
    'history:read', 'history:write',
    'settings:read', 'settings:write',
    'admin:read', 'admin:write',
  ];
  return validScopes.includes(scope as APIScope);
}

/**
 * Parse scope string from header or query.
 */
export function parseScopes(scopeString: string): APIScope[] {
  return scopeString
    .split(/[\s,]+/)
    .filter(isValidScope);
}

/**
 * Create a scope-checked middleware.
 */
export function requireScopes(requiredScopes: APIScope[]) {
  return (key: ScopedAPIKey | null): { authorized: boolean; missing?: APIScope[] } => {
    if (!key) {
      return { authorized: false, missing: requiredScopes };
    }
    
    const missing = requiredScopes.filter(scope => !key.scopes.includes(scope));
    
    return {
      authorized: missing.length === 0,
      missing: missing.length > 0 ? missing : undefined,
    };
  };
}

/**
 * Generate scope description for documentation.
 */
export function describeScopesResult(scopes: APIScope[]): Record<string, string> {
  const descriptions: Record<APIScope, string> = {
    'translate:read': 'Read translation history',
    'translate:write': 'Create new translations',
    'credits:read': 'View credit balance',
    'credits:write': 'Modify credits (purchase, transfer)',
    'history:read': 'View translation history',
    'history:write': 'Delete/modify history',
    'settings:read': 'View account settings',
    'settings:write': 'Modify account settings',
    'admin:read': 'View admin dashboard',
    'admin:write': 'Perform admin actions',
  };
  
  const result: Record<string, string> = {};
  for (const scope of scopes) {
    result[scope] = descriptions[scope];
  }
  return result;
}

/**
 * Check if key is expired.
 */
export function isKeyExpired(key: ScopedAPIKey): boolean {
  if (!key.expiresAt) return false;
  return new Date() > key.expiresAt;
}

/**
 * Check if IP is allowed for this key.
 */
export function isIPAllowed(key: ScopedAPIKey, ip: string): boolean {
  if (!key.ipWhitelist || key.ipWhitelist.length === 0) {
    return true; // No whitelist = all IPs allowed
  }
  return key.ipWhitelist.includes(ip);
}
