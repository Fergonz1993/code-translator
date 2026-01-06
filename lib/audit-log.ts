// ===== AUDIT LOGGING =====
// Log security-relevant events for audit trail.

export interface AuditEvent {
  timestamp: string;
  event: string;
  sessionId: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

type LogLevel = "info" | "warn" | "error";

/**
 * Format an audit log entry.
 */
function formatLogEntry(event: AuditEvent, level: LogLevel): string {
  const { timestamp, event: eventType, sessionId, ip, metadata } = event;
  const meta = metadata ? JSON.stringify(metadata) : "";
  return `[${level.toUpperCase()}] ${timestamp} | ${eventType} | session=${sessionId} | ip=${ip || "unknown"} | ${meta}`;
}

/**
 * Log an audit event.
 */
export function auditLog(event: Omit<AuditEvent, "timestamp">, level: LogLevel = "info"): void {
  const fullEvent: AuditEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  const message = formatLogEntry(fullEvent, level);

  switch (level) {
    case "error":
      console.error(message);
      break;
    case "warn":
      console.warn(message);
      break;
    default:
      console.log(message);
  }

  // In production, you'd send this to a logging service
  // e.g., await sendToLoggingService(fullEvent);
}

/**
 * Log authentication events.
 */
export function logAuth(sessionId: string, action: "login" | "logout" | "session_created", ip?: string): void {
  auditLog({
    event: `auth.${action}`,
    sessionId,
    ip,
  });
}

/**
 * Log credit transactions.
 */
export function logCreditTransaction(
  sessionId: string,
  action: "purchase" | "consume" | "grant",
  amount: number,
  source?: string
): void {
  auditLog({
    event: `credits.${action}`,
    sessionId,
    metadata: { amount, source },
  });
}

/**
 * Log API usage.
 */
export function logApiUsage(
  sessionId: string,
  endpoint: string,
  model: string,
  latencyMs: number,
  cached: boolean
): void {
  auditLog({
    event: "api.translate",
    sessionId,
    metadata: { endpoint, model, latencyMs, cached },
  });
}

/**
 * Log security events.
 */
export function logSecurityEvent(
  sessionId: string,
  eventType: "rate_limit" | "invalid_origin" | "csrf_failure" | "auth_failure",
  ip?: string,
  details?: Record<string, unknown>
): void {
  auditLog(
    {
      event: `security.${eventType}`,
      sessionId,
      ip,
      metadata: details,
    },
    "warn"
  );
}
