// ===== SQL INJECTION PREVENTION =====
// Utilities for preventing SQL injection attacks.

/**
 * SQL injection patterns to detect.
 */
const SQL_INJECTION_PATTERNS = [
  // Basic SQL keywords in suspicious contexts
  /(\b)(union\s+(all\s+)?select)(\b)/i,
  /(\b)(insert\s+into)(\b)/i,
  /(\b)(delete\s+from)(\b)/i,
  /(\b)(drop\s+(table|database|index))(\b)/i,
  /(\b)(truncate\s+table)(\b)/i,
  /(\b)(alter\s+table)(\b)/i,
  /(\b)(exec(\s+|\())(\b)/i,
  /(\b)(execute(\s+|\())(\b)/i,
  
  // Comment abuse
  /--\s*$/m,
  /\/\*[\s\S]*?\*\//,
  
  // Quote escaping attempts
  /'\s*or\s+'?\d*'?\s*=\s*'?\d*'?/i,
  /"\s*or\s+"?\d*"?\s*=\s*"?\d*"?/i,
  /'\s*or\s+'?[^']*'?\s*=\s*'?[^']*'?/i,
  
  // Boolean-based injection
  /'\s*or\s+1\s*=\s*1/i,
  /'\s*and\s+1\s*=\s*1/i,
  /'\s*or\s+'a'\s*=\s*'a/i,
  
  // Time-based injection
  /waitfor\s+delay/i,
  /sleep\s*\(/i,
  /benchmark\s*\(/i,
  
  // Stacked queries
  /;\s*(select|insert|update|delete|drop)/i,
];

export interface SQLCheckResult {
  safe: boolean;
  threats: string[];
  sanitized: string;
}

/**
 * Check input for SQL injection patterns.
 */
export function checkSQLInjection(input: string): SQLCheckResult {
  const threats: string[] = [];
  
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      threats.push(pattern.source.slice(0, 50));
    }
  }
  
  return {
    safe: threats.length === 0,
    threats,
    sanitized: escapeSQL(input),
  };
}

/**
 * Escape special SQL characters.
 */
export function escapeSQL(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/"/g, '""')
    // eslint-disable-next-line no-control-regex
    .replace(/\x00/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    // eslint-disable-next-line no-control-regex
    .replace(/\x1a/g, '\\Z');
}

/**
 * Parameterized query builder for SQLite.
 * Always use this instead of string concatenation.
 */
export function buildParameterizedQuery(
  sql: string,
  params: Record<string, unknown>
): { sql: string; values: unknown[] } {
  const values: unknown[] = [];
  
  const processedSQL = sql.replace(/:(\w+)/g, (_, key) => {
    if (!(key in params)) {
      throw new Error(`Missing parameter: ${key}`);
    }
    values.push(params[key]);
    return `?`;
  });
  
  return { sql: processedSQL, values };
}

/**
 * Validate table/column names (identifiers).
 */
export function isValidIdentifier(name: string): boolean {
  // Only allow alphanumeric and underscore, must start with letter/underscore
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

/**
 * Safely quote an identifier (table/column name).
 */
export function quoteIdentifier(name: string): string {
  if (!isValidIdentifier(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }
  return `"${name}"`;
}

/**
 * Create a safe LIKE pattern.
 */
export function safeLikePattern(input: string): string {
  return input
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/\[/g, '\\[');
}

/**
 * Validate and sanitize ORDER BY clause.
 */
export function safeOrderBy(
  column: string,
  direction: string,
  allowedColumns: string[]
): string {
  if (!allowedColumns.includes(column)) {
    throw new Error(`Invalid column for ORDER BY: ${column}`);
  }
  
  const dir = direction.toUpperCase();
  if (dir !== 'ASC' && dir !== 'DESC') {
    throw new Error(`Invalid direction for ORDER BY: ${direction}`);
  }
  
  return `${quoteIdentifier(column)} ${dir}`;
}

/**
 * Validate and sanitize LIMIT/OFFSET values.
 */
export function safePagination(
  limit: number,
  offset: number,
  maxLimit: number = 100
): { limit: number; offset: number } {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), maxLimit);
  const safeOffset = Math.max(0, Math.floor(offset));
  
  return { limit: safeLimit, offset: safeOffset };
}
