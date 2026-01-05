// ===== TOKEN UTILITIES =====
// Simple HMAC-based tokens for secure credit granting without a full database.

import crypto from "crypto";

// ===== TOKEN SECRET MANAGEMENT =====
// In production, TOKEN_SECRET must be set as an environment variable.
// In development, we allow a fallback for convenience, but this should
// never be used in production environments.

function getEffectiveSecret(): string {
  const envSecret = process.env.TOKEN_SECRET;
  
  // Production: require environment variable
  if (process.env.NODE_ENV === "production") {
    if (!envSecret) {
      console.error("❌ TOKEN_SECRET is required in production. Application will not start securely.");
      process.exit(1);
    }
    return envSecret;
  }
  
  // Development: allow fallback with warning
  if (envSecret) {
    return envSecret;
  }
  
  // Dev-only fallback (well-documented)
  console.warn("⚠️  TOKEN_SECRET not set. Using development-only fallback secret.");
  console.warn("⚠️  Set TOKEN_SECRET in your .env file for security.");
  return "fallback-secret-for-dev-only-DO-NOT-USE-IN-PRODUCTION";
}

const EFFECTIVE_SECRET = getEffectiveSecret();

/**
 * Creates a simple signed token (HMAC) for the client to claim credits.
 * This prevents users from spoofing the credit amount in URL parameters.
 * 
 * @param sessionId - The Stripe Checkout session ID
 * @param credits - The number of credits to grant
 * @returns A base64 encoded signed token
 */
export function generateCreditToken(sessionId: string, credits: number) {
  const payload = JSON.stringify({
    sessionId,
    credits,
    expiresAt: Date.now() + 1000 * 60 * 15, // 15 minutes expiry
  });
  
  const signature = crypto
    .createHmac("sha256", EFFECTIVE_SECRET)
    .update(payload)
    .digest("hex");
    
  return Buffer.from(JSON.stringify({ payload, signature })).toString("base64");
}

/**
 * Validates a credit token and returns the decoded payload if valid.
 * 
 * @param token - The base64 encoded token from the client
 * @returns The payload data or null if invalid/expired
 */
export function validateCreditToken(token: string) {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    const { payload, signature } = decoded;
    
    const expectedSignature = crypto
      .createHmac("sha256", EFFECTIVE_SECRET)
      .update(payload)
      .digest("hex");
    
    // ===== TIMING-SAFE SIGNATURE COMPARISON =====
    // Use timing-safe comparison to prevent timing attacks that could
    // leak information about the secret by measuring response times.
    // Both signatures must be the same length (hex strings from SHA-256 HMAC are always 64 chars).
    // If lengths differ, we normalize by comparing fixed-length buffers.
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    
    // Ensure both buffers are the same length for timing-safe comparison
    // SHA-256 HMAC produces 32 bytes (64 hex chars), but we normalize just in case
    const maxLength = Math.max(signatureBuffer.length, expectedBuffer.length);
    const normalizedSignature = Buffer.alloc(maxLength, 0);
    const normalizedExpected = Buffer.alloc(maxLength, 0);
    signatureBuffer.copy(normalizedSignature);
    expectedBuffer.copy(normalizedExpected);
    
    // Perform constant-time comparison
    if (!crypto.timingSafeEqual(normalizedSignature, normalizedExpected)) {
      console.warn("Invalid token signature detected");
      return null;
    }
    
    const data = JSON.parse(payload);
    if (data.expiresAt < Date.now()) {
      console.warn("Expired token detected");
      return null;
    }
    
    return data as { sessionId: string; credits: number; expiresAt: number };
  } catch (err) {
    console.error("Error decoding token:", err);
    return null;
  }
}
