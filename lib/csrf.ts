// ===== CSRF TOKEN UTILITY =====
// Generate and validate CSRF tokens.

import crypto from "crypto";

const CSRF_SECRET = process.env.SESSION_SECRET || "dev-csrf-secret";

/**
 * Generate a CSRF token for a session.
 */
export function generateCsrfToken(sessionId: string): string {
  const timestamp = Date.now().toString(36);
  const payload = `${sessionId}:${timestamp}`;
  const signature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 16);

  return `${timestamp}.${signature}`;
}

/**
 * Validate a CSRF token.
 */
export function validateCsrfToken(
  token: string,
  sessionId: string,
  maxAgeMs: number = 3600000 // 1 hour
): boolean {
  try {
    const [timestamp, signature] = token.split(".");
    if (!timestamp || !signature) return false;

    // Check token age
    const tokenTime = parseInt(timestamp, 36);
    if (Date.now() - tokenTime > maxAgeMs) return false;

    // Verify signature
    const payload = `${sessionId}:${timestamp}`;
    const expectedSignature = crypto
      .createHmac("sha256", CSRF_SECRET)
      .update(payload)
      .digest("hex")
      .slice(0, 16);

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Get CSRF token from request headers.
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
  return request.headers.get("x-csrf-token");
}
