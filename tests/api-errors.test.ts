// ===== API ERRORS TESTS =====
// Ensures consistent error payload shape for clients.

import { describe, it, expect } from "vitest";
import { jsonError } from "@/lib/api-errors";

describe("jsonError", () => {
  it("returns the minimal error payload", async () => {
    const response = jsonError({ error: "Bad request", status: 400 });

    expect(response.status).toBe(400);

    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toEqual({ error: "Bad request" });
  });

  it("includes requestId, code, and extra fields when provided", async () => {
    const response = jsonError({
      error: "Rate limit",
      status: 429,
      requestId: "req-123",
      code: "RATE_LIMIT_EXCEEDED",
      extra: { retryAfter: 10 },
    });

    expect(response.status).toBe(429);

    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toEqual({
      error: "Rate limit",
      requestId: "req-123",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: 10,
    });
  });
});
