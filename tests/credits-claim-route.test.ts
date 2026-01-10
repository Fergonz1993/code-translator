// ===== /api/credits/claim ROUTE TESTS =====
// Route-level tests for the Stripe credits claim flow.
//
// Goal:
// - Validate status codes and response shapes.
// - Avoid real Stripe network calls.
// - Avoid real SQLite writes.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ===== MOCKS =====

const mockGetServerStripe = vi.fn();
const mockEnsureSessionId = vi.fn();
const mockAttachSessionCookie = vi.fn();
const mockGrantCredits = vi.fn();

vi.mock("@/lib/stripe-server", () => {
  return {
    getServerStripe: () => mockGetServerStripe(),
  };
});

vi.mock("@/lib/session", () => {
  return {
    ensureSessionId: (request: unknown) => mockEnsureSessionId(request),
    attachSessionCookie: (response: unknown, sessionId: string) =>
      mockAttachSessionCookie(response, sessionId),
  };
});

vi.mock("@/lib/credits-store", () => {
  return {
    grantCredits: (options: unknown) => mockGrantCredits(options),
  };
});

// Avoid console logging in tests.
vi.mock("@/lib/api-logger", () => {
  return {
    createApiLogger: () => () => {},
  };
});

async function getClaimHandler() {
  const module = await import("@/app/api/credits/claim/route");
  return module.GET;
}

describe("GET /api/credits/claim", () => {
  const originalAppUrl = process.env.APP_URL;

  beforeEach(() => {
    vi.resetModules();

    process.env.APP_URL = "http://localhost:3000";

    mockGetServerStripe.mockReset();
    mockEnsureSessionId.mockReset();
    mockAttachSessionCookie.mockReset();
    mockGrantCredits.mockReset();

    mockEnsureSessionId.mockReturnValue({ sessionId: "session-123", isNew: false });
  });

  afterEach(() => {
    if (originalAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = originalAppUrl;
  });

  it("returns 403 for invalid origin", async () => {
    process.env.APP_URL = "https://trusted.example";

    const request = new NextRequest(
      "https://trusted.example/api/credits/claim?session_id=cs_test_123",
      {
        method: "GET",
        headers: {
          origin: "https://evil.example",
        },
      }
    );

    const GET = await getClaimHandler();
    const response = await GET(request);

    expect(response.status).toBe(403);
    expect(response.headers.get("X-Security-Error")).toContain("not allowed");

    const json = (await response.json()) as { error?: string };
    expect(json.error).toBe("Request blocked by security policy");
  });

  it("returns 400 when session_id is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/credits/claim", {
      method: "GET",
    });

    const GET = await getClaimHandler();
    const response = await GET(request);

    expect(response.status).toBe(400);

    const json = (await response.json()) as { error?: string };
    expect(json.error).toContain("Checkout session ID is required");
  });

  it("returns 503 when Stripe is not configured", async () => {
    mockGetServerStripe.mockReturnValue(null);

    const request = new NextRequest(
      "http://localhost:3000/api/credits/claim?session_id=cs_test_123",
      { method: "GET" }
    );

    const GET = await getClaimHandler();
    const response = await GET(request);

    expect(response.status).toBe(503);

    const json = (await response.json()) as { error?: string };
    expect(json.error).toBe("Stripe not configured");
  });

  it("returns pending when payment is not yet confirmed", async () => {
    const retrieve = vi.fn().mockResolvedValue({
      id: "cs_test_123",
      payment_status: "unpaid",
      metadata: {},
    });

    mockGetServerStripe.mockReturnValue({
      checkout: { sessions: { retrieve } },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/credits/claim?session_id=cs_test_123",
      { method: "GET" }
    );

    const GET = await getClaimHandler();
    const response = await GET(request);

    expect(response.status).toBe(200);

    const json = (await response.json()) as { status?: string; message?: string };
    expect(json.status).toBe("pending");
    expect(json.message).toBe("Payment not yet confirmed");
  });

  it("returns 400 when Stripe metadata has no credits", async () => {
    const retrieve = vi.fn().mockResolvedValue({
      id: "cs_test_123",
      payment_status: "paid",
      metadata: {},
    });

    mockGetServerStripe.mockReturnValue({
      checkout: { sessions: { retrieve } },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/credits/claim?session_id=cs_test_123",
      { method: "GET" }
    );

    const GET = await getClaimHandler();
    const response = await GET(request);

    expect(response.status).toBe(400);

    const json = (await response.json()) as { error?: string };
    expect(json.error).toBe("No credits found for this session");
  });

  it("returns 403 when Stripe metadata sessionId does not match", async () => {
    const retrieve = vi.fn().mockResolvedValue({
      id: "cs_test_123",
      payment_status: "paid",
      metadata: {
        credits: "50",
        sessionId: "different-session",
      },
    });

    mockGetServerStripe.mockReturnValue({
      checkout: { sessions: { retrieve } },
    });

    const request = new NextRequest(
      "http://localhost:3000/api/credits/claim?session_id=cs_test_123",
      { method: "GET" }
    );

    const GET = await getClaimHandler();
    const response = await GET(request);

    expect(response.status).toBe(403);

    const json = (await response.json()) as { error?: string };
    expect(json.error).toBe("Session mismatch");
  });

  it("returns success and grants credits for paid sessions", async () => {
    const retrieve = vi.fn().mockResolvedValue({
      id: "cs_test_123",
      payment_status: "paid",
      metadata: {
        credits: "50",
        sessionId: "session-123",
      },
    });

    mockGetServerStripe.mockReturnValue({
      checkout: { sessions: { retrieve } },
    });

    mockGrantCredits.mockReturnValue({ total: 70, used: 10, remaining: 60 });

    const request = new NextRequest(
      "http://localhost:3000/api/credits/claim?session_id=cs_test_123",
      { method: "GET" }
    );

    const GET = await getClaimHandler();
    const response = await GET(request);

    expect(response.status).toBe(200);

    const json = (await response.json()) as {
      status?: string;
      creditsAdded?: number;
      balance?: { total?: number; used?: number; remaining?: number };
    };

    expect(json.status).toBe("success");
    expect(json.creditsAdded).toBe(50);
    expect(json.balance).toEqual({ total: 70, used: 10, remaining: 60 });

    expect(mockGrantCredits).toHaveBeenCalledTimes(1);
    expect(mockGrantCredits).toHaveBeenCalledWith({
      sessionId: "session-123",
      amount: 50,
      source: "stripe",
      idempotencyKey: "stripe:cs_test_123",
    });
  });
});
