// ===== CSP NONCE GENERATOR =====
// Generate cryptographic nonces for Content Security Policy.

import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure nonce for CSP.
 * Base64 encoded for URL-safe usage.
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

/**
 * Create a CSP header value with the provided nonce.
 */
export function buildCSPWithNonce(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://api.anthropic.com https://api.stripe.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');
}

/**
 * CSP header for report-only mode (useful for testing).
 */
export function buildCSPReportOnly(nonce: string, reportUri: string): string {
  return `${buildCSPWithNonce(nonce)}; report-uri ${reportUri}`;
}
