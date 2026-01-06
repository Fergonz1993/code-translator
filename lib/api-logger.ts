// ===== API LOGGING =====
// Structured logging helpers for API routes.

export type ApiLogEntry = {
  event: "api";
  route: string;
  method: string;
  status: number;
  requestId: string;
  latencyMs: number;
  error?: string;
  meta?: Record<string, unknown>;
};

export function buildApiLog(entry: ApiLogEntry) {
  const payload: Record<string, unknown> = {
    event: entry.event,
    route: entry.route,
    method: entry.method,
    status: entry.status,
    requestId: entry.requestId,
    latencyMs: entry.latencyMs,
  };

  if (entry.error) {
    payload.error = entry.error;
  }

  if (entry.meta) {
    payload.meta = entry.meta;
  }

  return payload;
}

export function logApiEvent(entry: ApiLogEntry) {
  const payload = buildApiLog(entry);
  const message = JSON.stringify(payload);

  if (entry.status >= 500) {
    console.error(message);
    return;
  }

  if (entry.status >= 400) {
    console.warn(message);
    return;
  }

  console.info(message);
}

export function createApiLogger(options: {
  route: string;
  method: string;
  requestId: string;
  startTime: number;
}) {
  return (entry: { status: number; error?: string; meta?: Record<string, unknown> }) => {
    logApiEvent({
      event: "api",
      route: options.route,
      method: options.method,
      status: entry.status,
      requestId: options.requestId,
      latencyMs: Date.now() - options.startTime,
      error: entry.error,
      meta: entry.meta,
    });
  };
}
