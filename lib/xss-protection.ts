// ===== XSS PROTECTION =====
// Enhanced XSS protection with DOMPurify-like sanitization.

/**
 * HTML entities to escape.
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Dangerous tags to remove.
 */
const DANGEROUS_TAGS = [
  'script',
  'style',
  'iframe',
  'frame',
  'frameset',
  'object',
  'embed',
  'applet',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'link',
  'meta',
  'base',
  'svg',
  'math',
];

/**
 * Dangerous attributes to remove.
 */
const DANGEROUS_ATTRS = [
  'onclick',
  'ondblclick',
  'onmousedown',
  'onmouseup',
  'onmouseover',
  'onmousemove',
  'onmouseout',
  'onkeydown',
  'onkeypress',
  'onkeyup',
  'onload',
  'onerror',
  'onunload',
  'onsubmit',
  'onreset',
  'onfocus',
  'onblur',
  'onchange',
  'oninput',
  'onscroll',
  'onwheel',
  'oncopy',
  'oncut',
  'onpaste',
  'ondrag',
  'ondragend',
  'ondragenter',
  'ondragleave',
  'ondragover',
  'ondragstart',
  'ondrop',
  'onanimationend',
  'onanimationiteration',
  'onanimationstart',
  'ontransitionend',
  'formaction',
  'xlink:href',
  'xmlns',
];

/**
 * Dangerous URL schemes.
 */
const DANGEROUS_SCHEMES = [
  'javascript:',
  'vbscript:',
  'data:text/html',
  'data:application/x-javascript',
];

export interface SanitizeConfig {
  allowedTags?: string[];
  allowedAttrs?: string[];
  allowDataAttrs?: boolean;
  stripComments?: boolean;
}

/**
 * Escape HTML entities in a string.
 */
export function escapeHTML(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Unescape HTML entities.
 */
export function unescapeHTML(str: string): string {
  const doc = new DOMParser().parseFromString(str, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Check if a URL scheme is dangerous.
 */
export function isDangerousURL(url: string): boolean {
  const lowercaseURL = url.toLowerCase().trim();
  return DANGEROUS_SCHEMES.some(scheme => lowercaseURL.startsWith(scheme));
}

/**
 * Sanitize URL for safe use in href/src attributes.
 */
export function sanitizeURL(url: string): string {
  if (isDangerousURL(url)) {
    return '#';
  }
  return url;
}

/**
 * Remove dangerous patterns from HTML string (server-side safe).
 */
export function sanitizeHTMLString(html: string, config: SanitizeConfig = {}): string {
  let sanitized = html;
  
  // Remove dangerous tags
  for (const tag of DANGEROUS_TAGS) {
    const openTagRegex = new RegExp(`<${tag}[^>]*>`, 'gi');
    const closeTagRegex = new RegExp(`</${tag}>`, 'gi');
    const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi');
    
    sanitized = sanitized
      .replace(openTagRegex, '')
      .replace(closeTagRegex, '')
      .replace(selfClosingRegex, '');
  }
  
  // Remove dangerous attributes
  for (const attr of DANGEROUS_ATTRS) {
    const attrRegex = new RegExp(`\\s*${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    const attrRegexNoQuotes = new RegExp(`\\s*${attr}\\s*=\\s*[^\\s>]+`, 'gi');
    
    sanitized = sanitized
      .replace(attrRegex, '')
      .replace(attrRegexNoQuotes, '');
  }
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href="#"');
  sanitized = sanitized.replace(/src\s*=\s*["']javascript:[^"']*["']/gi, 'src=""');
  
  // Remove HTML comments if configured
  if (config.stripComments !== false) {
    sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');
  }
  
  return sanitized;
}

/**
 * Sanitize text content for safe DOM insertion.
 */
export function sanitizeTextContent(text: string): string {
  return escapeHTML(text);
}

/**
 * Validate and sanitize JSON for XSS safety.
 */
export function sanitizeJSON(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return escapeHTML(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeJSON);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[escapeHTML(key)] = sanitizeJSON(value);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Create a safe text node content.
 */
export function safeTextNode(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sanitize for use in HTML attributes.
 */
export function sanitizeAttribute(value: string): string {
  return escapeHTML(value).replace(/\n/g, '&#10;').replace(/\r/g, '&#13;');
}
