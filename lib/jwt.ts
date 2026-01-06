// ===== JWT TOKEN MANAGEMENT =====
// Token rotation and refresh functionality.

import { createHmac, randomBytes } from 'crypto';

export interface TokenPayload {
  sub: string; // Subject (user/session ID)
  iat: number; // Issued at
  exp: number; // Expiration
  jti: string; // JWT ID (unique token identifier)
  type: 'access' | 'refresh';
  scope?: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
}

const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

// Track revoked tokens (in production, use Redis or database)
const revokedTokens = new Set<string>();

/**
 * Generate a unique token ID.
 */
function generateTokenId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Base64URL encode.
 */
function base64URLEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64URL decode.
 */
function base64URLDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64').toString();
}

/**
 * Create a JWT token.
 */
export function createToken(
  payload: Omit<TokenPayload, 'iat' | 'exp' | 'jti'>,
  secret: string,
  ttlSeconds: number
): string {
  const now = Math.floor(Date.now() / 1000);
  
  const fullPayload: TokenPayload = {
    ...payload,
    iat: now,
    exp: now + ttlSeconds,
    jti: generateTokenId(),
  };
  
  const header = base64URLEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadStr = base64URLEncode(JSON.stringify(fullPayload));
  const signature = createHmac('sha256', secret)
    .update(`${header}.${payloadStr}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${header}.${payloadStr}.${signature}`;
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(
  token: string,
  secret: string
): { valid: boolean; payload?: TokenPayload; error?: string } {
  try {
    const [header, payloadStr, signature] = token.split('.');
    
    if (!header || !payloadStr || !signature) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    // Verify signature
    const expectedSignature = createHmac('sha256', secret)
      .update(`${header}.${payloadStr}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    // Decode payload
    const payload = JSON.parse(base64URLDecode(payloadStr)) as TokenPayload;
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, error: 'Token expired' };
    }
    
    // Check if revoked
    if (revokedTokens.has(payload.jti)) {
      return { valid: false, error: 'Token revoked' };
    }
    
    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Token parsing failed' };
  }
}

/**
 * Generate access and refresh token pair.
 */
export function generateTokenPair(
  subject: string,
  secret: string,
  scope?: string[]
): TokenPair {
  const accessToken = createToken(
    { sub: subject, type: 'access', scope },
    secret,
    ACCESS_TOKEN_TTL
  );
  
  const refreshToken = createToken(
    { sub: subject, type: 'refresh' },
    secret,
    REFRESH_TOKEN_TTL
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL,
    refreshExpiresIn: REFRESH_TOKEN_TTL,
  };
}

/**
 * Refresh tokens using a valid refresh token.
 */
export function refreshTokens(
  refreshToken: string,
  secret: string,
  scope?: string[]
): { success: boolean; tokens?: TokenPair; error?: string } {
  const result = verifyToken(refreshToken, secret);
  
  if (!result.valid || !result.payload) {
    return { success: false, error: result.error };
  }
  
  if (result.payload.type !== 'refresh') {
    return { success: false, error: 'Invalid token type' };
  }
  
  // Revoke old refresh token (rotation)
  revokedTokens.add(result.payload.jti);
  
  // Generate new pair
  const tokens = generateTokenPair(result.payload.sub, secret, scope);
  
  return { success: true, tokens };
}

/**
 * Revoke a token by its JTI.
 */
export function revokeToken(jti: string): void {
  revokedTokens.add(jti);
}

/**
 * Revoke all tokens for a subject (user logout).
 */
export function revokeAllTokens(subject: string): void {
  // In production, this would invalidate all tokens in database
  console.log(`[Token] Revoking all tokens for subject: ${subject}`);
}

/**
 * Clean up expired revoked tokens.
 */
export function cleanupRevokedTokens(): number {
  // In production, clean expired entries from database
  // For in-memory, we keep all revoked tokens
  return 0;
}
