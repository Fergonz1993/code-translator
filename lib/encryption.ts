// ===== API KEY ENCRYPTION =====
// Encrypt and decrypt API keys for storage.

import crypto from "crypto";

const ENCRYPTION_KEY = process.env.SESSION_SECRET || "dev-encryption-key-32c";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/**
 * Derive a 32-byte key from the secret.
 */
function getKey(): Buffer {
  return crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
}

/**
 * Encrypt an API key for storage.
 */
export function encryptApiKey(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  // Format: iv:tag:encrypted
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a stored API key.
 */
export function decryptApiKey(encryptedData: string): string | null {
  try {
    const [ivHex, tagHex, encrypted] = encryptedData.split(":");
    if (!ivHex || !tagHex || !encrypted) return null;

    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Check if a string looks like an encrypted API key.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  return parts.length === 3 && parts[0].length === IV_LENGTH * 2;
}

/**
 * Mask an API key for display (show first 4 and last 4 chars).
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length < 12) return "****";
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}
