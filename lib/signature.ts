// ===== API SIGNATURE VALIDATION =====
// Verify webhook and API request signatures.

import { createHmac, timingSafeEqual } from 'crypto';

export interface SignatureConfig {
  secret: string;
  algorithm?: 'sha256' | 'sha512';
  headerName?: string;
  timestampHeaderName?: string;
  toleranceSeconds?: number;
}

/**
 * Generate HMAC signature for a payload.
 */
export function generateSignature(
  payload: string | Buffer,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): string {
  return createHmac(algorithm, secret).update(payload).digest('hex');
}

/**
 * Generate a timestamped signature (Stripe-style).
 */
export function generateTimestampedSignature(
  payload: string | Buffer,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): { signature: string; timestamp: number } {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = generateSignature(signedPayload, secret);
  return { signature: `t=${timestamp},v1=${signature}`, timestamp };
}

/**
 * Verify a simple HMAC signature.
 */
export function verifySignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  const expected = generateSignature(payload, secret, algorithm);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');
  
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }
  
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

/**
 * Verify a timestamped signature (Stripe-style).
 */
export function verifyTimestampedSignature(
  payload: string | Buffer,
  header: string,
  secret: string,
  toleranceSeconds: number = 300
): { valid: boolean; timestamp?: number; error?: string } {
  // Parse header: t=timestamp,v1=signature
  const parts = header.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    if (key && value) acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parseInt(parts['t'] || '', 10);
  const signature = parts['v1'];

  if (!timestamp || !signature) {
    return { valid: false, error: 'Invalid signature format' };
  }

  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return { valid: false, timestamp, error: 'Timestamp outside tolerance' };
  }

  // Verify signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = generateSignature(signedPayload, secret);
  
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');
  
  if (expectedBuffer.length !== signatureBuffer.length) {
    return { valid: false, timestamp, error: 'Signature length mismatch' };
  }
  
  const valid = timingSafeEqual(expectedBuffer, signatureBuffer);
  return { valid, timestamp, error: valid ? undefined : 'Signature mismatch' };
}

/**
 * Middleware helper to extract and verify request signature.
 */
export function createSignatureVerifier(config: SignatureConfig) {
  const {
    secret,
    algorithm = 'sha256',
    headerName = 'x-signature',
    timestampHeaderName = 'x-timestamp',
    toleranceSeconds = 300,
  } = config;

  return (payload: string | Buffer, headers: Record<string, string | undefined>): boolean => {
    const signature = headers[headerName.toLowerCase()];
    const timestamp = headers[timestampHeaderName.toLowerCase()];

    if (!signature) return false;

    if (timestamp) {
      const ts = parseInt(timestamp, 10);
      const now = Math.floor(Date.now() / 1000);
      if (Math.abs(now - ts) > toleranceSeconds) return false;
      
      const signedPayload = `${timestamp}.${payload}`;
      return verifySignature(signedPayload, signature, secret, algorithm);
    }

    return verifySignature(payload, signature, secret, algorithm);
  };
}
