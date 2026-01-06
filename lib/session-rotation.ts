// ===== SESSION ROTATION =====
// Rotate session tokens after privilege changes.

import { cookies } from 'next/headers';
import { randomBytes, createHmac } from 'crypto';

// Session helpers (inline to avoid import issues)
function generateSessionId(): string {
  return randomBytes(16).toString('hex');
}

function signSession(sessionId: string): string {
  const secret = process.env.SESSION_SECRET || 'dev-secret';
  const sig = createHmac('sha256', secret).update(sessionId).digest('hex').slice(0, 16);
  return `${sessionId}.${sig}`;
}

function verifySession(signedSession: string): string | null {
  const parts = signedSession.split('.');
  if (parts.length !== 2) return null;
  
  const [sessionId, sig] = parts;
  const secret = process.env.SESSION_SECRET || 'dev-secret';
  const expectedSig = createHmac('sha256', secret).update(sessionId).digest('hex').slice(0, 16);
  
  if (sig !== expectedSig) return null;
  return sessionId;
}

export interface SessionRotationConfig {
  cookieName?: string;
  onRotate?: (oldSessionId: string, newSessionId: string) => Promise<void>;
}

/**
 * Privilege levels that trigger session rotation.
 */
export type PrivilegeChange = 
  | 'login'
  | 'logout'
  | 'elevation'
  | 'payment'
  | 'api_key_change'
  | 'password_change';

/**
 * Rotate session after a privilege change.
 * Creates a new session ID and invalidates the old one.
 */
export async function rotateSession(
  reason: PrivilegeChange,
  config: SessionRotationConfig = {}
): Promise<{ oldSessionId: string; newSessionId: string }> {
  const { cookieName = 'session', onRotate } = config;
  
  const cookieStore = await cookies();
  const currentCookie = cookieStore.get(cookieName);
  
  // Get current session ID
  let oldSessionId = '';
  if (currentCookie?.value) {
    const verified = verifySession(currentCookie.value);
    if (verified) {
      oldSessionId = verified;
    }
  }
  
  // Generate new session
  const newSessionId = generateSessionId();
  const signedSession = signSession(newSessionId);
  
  // Set new cookie
  cookieStore.set(cookieName, signedSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  
  // Call rotation callback if provided
  if (onRotate && oldSessionId) {
    await onRotate(oldSessionId, newSessionId);
  }
  
  console.log('[Session Rotation]', {
    reason,
    oldSessionId: oldSessionId ? `${oldSessionId.slice(0, 8)}...` : 'none',
    newSessionId: `${newSessionId.slice(0, 8)}...`,
    timestamp: new Date().toISOString(),
  });
  
  return { oldSessionId, newSessionId };
}

/**
 * Check if session should be rotated based on age.
 */
export function shouldRotateByAge(
  sessionCreatedAt: number,
  maxAgeSeconds: number = 60 * 60 * 24 // 24 hours
): boolean {
  const age = Date.now() - sessionCreatedAt;
  return age > maxAgeSeconds * 1000;
}

/**
 * Rotate session if it's too old.
 */
export async function rotateIfStale(
  sessionCreatedAt: number,
  maxAgeSeconds?: number
): Promise<boolean> {
  if (shouldRotateByAge(sessionCreatedAt, maxAgeSeconds)) {
    await rotateSession('elevation', {});
    return true;
  }
  return false;
}
