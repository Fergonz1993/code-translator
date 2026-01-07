// ===== PROMPT INJECTION PROTECTION =====
// Sanitize code input to prevent prompt injection attacks.

/**
 * Known prompt injection patterns to detect and block.
 */
const INJECTION_PATTERNS = [
  // Direct instruction override attempts
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)/i,
  /forget\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?)/i,
  
  // Role manipulation
  /you\s+are\s+(now|no\s+longer)\s+a/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /act\s+as\s+(if\s+you\s+are|a)/i,
  /roleplay\s+as/i,
  
  // System prompt extraction
  /what\s+(is|are)\s+(your|the)\s+(system\s+)?prompt/i,
  /show\s+(me\s+)?(your|the)\s+(system\s+)?prompt/i,
  /reveal\s+(your|the)\s+instructions?/i,
  /print\s+(your|the)\s+instructions?/i,
  
  // Jailbreak attempts
  /DAN\s+mode/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /bypass\s+(safety|restrictions?|filters?)/i,
  
  // Output manipulation
  /output\s+only/i,
  /respond\s+(only\s+)?with/i,
  /say\s+(only\s+)?["'`]/i,
  
  // Hidden instructions in comments
  /<!--\s*system:/i,
  /\/\*\s*AI:/i,
  /\/\/\s*INSTRUCTION:/i,
  /#\s*SYSTEM\s*OVERRIDE/i,
];

/**
 * Suspicious patterns that warrant extra scrutiny.
 */
const SUSPICIOUS_PATTERNS = [
  // Base64 encoded content
  /[A-Za-z0-9+/]{50,}={0,2}/,
  
  // Excessive special characters
  // eslint-disable-next-line no-useless-escape
  /[^\w\s.,;:'"(){}\[\]<>\/\\-]{10,}/,
  
  // Unicode control characters
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u001F\u007F-\u009F]/,
  
  // Right-to-left override
  /\u202E/,
  
  // Zero-width characters
  /[\u200B-\u200D\uFEFF]/,
];

export interface SanitizeResult {
  safe: boolean;
  sanitized: string;
  threats: string[];
  suspicious: boolean;
  warnings: string[];
}

/**
 * Sanitize code input to prevent prompt injection.
 */
export function sanitizeCodeInput(input: string): SanitizeResult {
  const threats: string[] = [];
  const warnings: string[] = [];
  let sanitized = input;
  
  // Check for known injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      threats.push(`Detected injection pattern: ${pattern.source.slice(0, 50)}...`);
    }
  }
  
  // Check for suspicious patterns
  let suspicious = false;
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(input)) {
      suspicious = true;
      warnings.push(`Suspicious pattern detected: ${pattern.source.slice(0, 30)}...`);
    }
  }
  
  // Remove zero-width characters
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // Remove Unicode control characters (except newlines and tabs)
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  
  // Remove right-to-left override characters
  sanitized = sanitized.replace(/\u202E/g, '');
  
  // Limit consecutive special characters
  sanitized = sanitized.replace(/([^\w\s])\1{10,}/g, '$1$1$1');
  
  return {
    safe: threats.length === 0,
    sanitized,
    threats,
    suspicious,
    warnings,
  };
}

/**
 * Quick check if input is likely safe (faster than full sanitize).
 */
export function isLikelySafe(input: string): boolean {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return false;
    }
  }
  return true;
}

/**
 * Escape special characters that could be interpreted as prompt parts.
 */
export function escapeForPrompt(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');
}

/**
 * Wrap code in a safe container for the prompt.
 */
export function wrapCodeSafely(code: string): string {
  const sanitized = sanitizeCodeInput(code);
  
  if (!sanitized.safe) {
    console.warn('[Prompt Injection] Threats detected:', sanitized.threats);
  }
  
  // Use unique delimiters that are unlikely to appear in code
  const delimiter = '<<<CODE_BLOCK_' + Math.random().toString(36).slice(2, 10) + '>>>';
  
  return `${delimiter}\n${sanitized.sanitized}\n${delimiter}`;
}

/**
 * Log suspicious input for security monitoring.
 */
export function logSuspiciousInput(
  input: string,
  result: SanitizeResult,
  metadata: Record<string, unknown> = {}
): void {
  if (!result.safe || result.suspicious) {
    console.warn('[Prompt Injection] Suspicious input detected', {
      safe: result.safe,
      threats: result.threats,
      warnings: result.warnings,
      inputLength: input.length,
      inputPreview: input.slice(0, 100) + '...',
      ...metadata,
    });
  }
}
