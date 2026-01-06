// ===== INPUT SANITIZATION =====
// Sanitize user input to prevent XSS and injection.

/**
 * Escape HTML special characters to prevent XSS.
 */
export function escapeHtml(input: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Remove HTML tags from input.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize input for use in SQL (basic prevention).
 * Note: Always use parameterized queries - this is a fallback.
 */
export function sanitizeSql(input: string): string {
  return input.replace(/['";\\]/g, "");
}

/**
 * Validate and sanitize a URL.
 */
export function sanitizeUrl(input: string): string | null {
  try {
    const url = new URL(input);
    // Only allow http and https protocols
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Truncate string to max length with ellipsis.
 */
export function truncate(input: string, maxLength: number): string {
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength - 3) + "...";
}

/**
 * Remove control characters from input.
 */
export function removeControlChars(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Comprehensive sanitization for user-provided text.
 */
export function sanitizeText(input: string, options: {
  maxLength?: number;
  allowHtml?: boolean;
} = {}): string {
  let result = removeControlChars(input);
  
  if (!options.allowHtml) {
    result = escapeHtml(result);
  }
  
  if (options.maxLength) {
    result = truncate(result, options.maxLength);
  }
  
  return result.trim();
}
