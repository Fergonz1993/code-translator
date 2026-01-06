// ===== API ERROR UTILITIES =====
// Helper to standardize error responses with requestId and optional metadata.

import { NextResponse } from "next/server";

export function jsonError(options: {
  error: string;
  status: number;
  requestId?: string;
  code?: string;
  extra?: Record<string, unknown>;
}) {
  const payload: Record<string, unknown> = {
    error: options.error,
  };

  if (options.requestId) {
    payload.requestId = options.requestId;
  }

  if (options.code) {
    payload.code = options.code;
  }

  if (options.extra) {
    Object.assign(payload, options.extra);
  }

  return NextResponse.json(payload, { status: options.status });
}
