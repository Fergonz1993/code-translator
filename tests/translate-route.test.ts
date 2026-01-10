// ===== /api/translate ROUTE TESTS =====
// These are lightweight “boundary” tests:
// - They prove the route rejects bad input early.
// - They avoid calling AI providers, Stripe, or SQLite.
//
// Why this matters (risk reduction):
// - We want hard limits that prevent runaway cost / DoS.
// - We want clean, predictable error codes for clients.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { MAX_TRANSLATE_REQUEST_BYTES } from "@/lib/constants";

async function getTranslateHandler() {
  const module = await import("@/app/api/translate/route");
  return module.POST;
}

describe("POST /api/translate", () => {
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = "test-session-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSecret;
  });

  it("returns 400 for invalid JSON", async () => {
    const request = new NextRequest("https://example.com/api/translate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: "{not valid json",
    });

    const POST = await getTranslateHandler();
    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = (await response.json()) as { error?: string };
    expect(json.error).toBe("Invalid JSON body.");
  });

  it("returns 413 for payloads over the hard byte limit", async () => {
    const tooLargeCode = "a".repeat(MAX_TRANSLATE_REQUEST_BYTES + 5_000);

    const request = new NextRequest("https://example.com/api/translate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        code: tooLargeCode,
        language: "javascript",
        model: "gpt-4o-mini",
      }),
    });

    const POST = await getTranslateHandler();
    const response = await POST(request);
    expect(response.status).toBe(413);

    const json = (await response.json()) as { error?: string };
    expect(json.error).toBe("Request payload too large.");
  });

  it("returns 400 for schema-invalid requests (empty code)", async () => {
    const request = new NextRequest("https://example.com/api/translate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        code: "",
        language: "javascript",
        model: "gpt-4o-mini",
      }),
    });

    const POST = await getTranslateHandler();
    const response = await POST(request);
    expect(response.status).toBe(400);

    const json = (await response.json()) as { error?: string };
    expect(json.error).toContain("Code is required");
  });
});
