// ===== SUBRESOURCE INTEGRITY (SRI) =====
// Generate and verify SRI hashes for CDN assets.

import { createHash } from 'crypto';

export type SRIAlgorithm = 'sha256' | 'sha384' | 'sha512';

/**
 * Generate an SRI hash for the given content.
 */
export function generateSRIHash(
  content: string | Buffer,
  algorithm: SRIAlgorithm = 'sha384'
): string {
  const hash = createHash(algorithm).update(content).digest('base64');
  return `${algorithm}-${hash}`;
}

/**
 * Verify content against an SRI hash.
 */
export function verifySRI(
  content: string | Buffer,
  integrityHash: string
): boolean {
  const [algorithm, expectedHash] = integrityHash.split('-') as [SRIAlgorithm, string];
  if (!algorithm || !expectedHash) return false;
  
  const actualHash = createHash(algorithm).update(content).digest('base64');
  return actualHash === expectedHash;
}

/**
 * Generate SRI attributes for a script tag.
 */
export function sriScriptAttrs(hash: string): { integrity: string; crossorigin: string } {
  return {
    integrity: hash,
    crossorigin: 'anonymous',
  };
}

/**
 * Common CDN asset SRI hashes (pre-computed for popular libraries).
 * Add hashes for any CDN assets used in the project.
 */
export const CDN_SRI_HASHES: Record<string, string> = {
  // Add verified hashes for any external CDN resources here
  // Example: 'https://cdn.example.com/lib.js': 'sha384-...'
};

/**
 * Get SRI hash for a known CDN resource.
 */
export function getCDNHash(url: string): string | undefined {
  return CDN_SRI_HASHES[url];
}
