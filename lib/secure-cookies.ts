// ===== SECURE COOKIE CONFIGURATION =====
// Enhanced cookie security with SameSite and Partitioned attributes.

export interface SecureCookieOptions {
  name: string;
  value: string;
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  partitioned?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Default secure cookie options.
 */
export const SECURE_COOKIE_DEFAULTS: Partial<SecureCookieOptions> = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

/**
 * Build a Set-Cookie header value with all security attributes.
 */
export function buildSecureCookie(options: SecureCookieOptions): string {
  const opts = { ...SECURE_COOKIE_DEFAULTS, ...options };
  const parts: string[] = [];
  
  // Name and value (URL encoded)
  parts.push(`${encodeURIComponent(opts.name)}=${encodeURIComponent(opts.value)}`);
  
  // Expiration
  if (opts.maxAge !== undefined) {
    parts.push(`Max-Age=${opts.maxAge}`);
  }
  if (opts.expires) {
    parts.push(`Expires=${opts.expires.toUTCString()}`);
  }
  
  // Path and Domain
  if (opts.path) {
    parts.push(`Path=${opts.path}`);
  }
  if (opts.domain) {
    parts.push(`Domain=${opts.domain}`);
  }
  
  // Security flags
  if (opts.secure) {
    parts.push('Secure');
  }
  if (opts.httpOnly) {
    parts.push('HttpOnly');
  }
  
  // SameSite attribute
  if (opts.sameSite) {
    parts.push(`SameSite=${opts.sameSite.charAt(0).toUpperCase() + opts.sameSite.slice(1)}`);
  }
  
  // Partitioned attribute (CHIPS - Cookies Having Independent Partitioned State)
  if (opts.partitioned) {
    parts.push('Partitioned');
  }
  
  // Priority (Chrome extension)
  if (opts.priority) {
    parts.push(`Priority=${opts.priority.charAt(0).toUpperCase() + opts.priority.slice(1)}`);
  }
  
  return parts.join('; ');
}

/**
 * Create a session cookie with secure defaults.
 */
export function createSessionCookie(value: string, name: string = 'session'): string {
  return buildSecureCookie({
    name,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Create a CSRF token cookie.
 */
export function createCSRFCookie(token: string): string {
  return buildSecureCookie({
    name: 'csrf-token',
    value: token,
    httpOnly: false, // JS needs to read this
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

/**
 * Create a remember-me cookie with extended expiration.
 */
export function createRememberMeCookie(token: string): string {
  return buildSecureCookie({
    name: 'remember-me',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });
}

/**
 * Create a cookie to delete/expire.
 */
export function createExpiredCookie(name: string): string {
  return buildSecureCookie({
    name,
    value: '',
    maxAge: 0,
    expires: new Date(0),
    path: '/',
  });
}

/**
 * Parse cookie value from header.
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  
  if (!cookieHeader) return cookies;
  
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const [name, ...rest] = pair.trim().split('=');
    if (name) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(rest.join('='));
    }
  }
  
  return cookies;
}

/**
 * Validate cookie security settings.
 */
export function validateCookieSecurity(
  options: SecureCookieOptions
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  if (!options.httpOnly && options.name.toLowerCase().includes('session')) {
    warnings.push('Session cookies should be HttpOnly');
  }
  
  if (!options.secure && process.env.NODE_ENV === 'production') {
    warnings.push('Cookies should use Secure flag in production');
  }
  
  if (options.sameSite === 'none' && !options.secure) {
    warnings.push('SameSite=None requires Secure flag');
  }
  
  if (!options.sameSite) {
    warnings.push('SameSite attribute should be explicitly set');
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  };
}
