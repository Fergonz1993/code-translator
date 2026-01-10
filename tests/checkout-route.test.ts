// ===== /api/checkout ROUTE TESTS =====
// Lightweight route-level tests for Stripe checkout creation.
//
// Goal:
// - Validate the endpoint returns stable status codes and messages.
// - Avoid real Stripe network calls.
// - Avoid touching the real credits database.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ===== MOCKS =====

const mockGetServerStripe = vi.fn();
const mockEnsureSessionId = vi.fn();
const mockAttachSessionCookie = vi.fn();
const mockGetCreditsBalance = vi.fn();

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
    getCreditsBalance: (sessionId: string) => mockGetCreditsBalance(sessionId),
  };
});

// Avoid console logging in tests.
vi.mock("@/lib/api-logger", () => {
  return {
    createApiLogger: () => () => {},
  };
});

// Avoid importing Stripe.js in a server-route test.
vi.mock("@/lib/stripe", () => {
  return {
    CREDIT_PACKAGES: [
      { id: "credits_50", credits: 50, price: 499 },
      { id: "credits_150", credits: 150, price: 999 },
      { id: "credits_500", credits: 500, price: 2499 },
    ],
  };
});

async function getCheckoutHandler() {
  const module = await import("@/app/api/checkout/route");
  return module.POST;
}

describe("POST /api/checkout", () => {
  const originalAppUrl = process.env.APP_URL;

  beforeEach(() => {
    vi.resetModules();

    process.env.APP_URL = "http://localhost:3000";

    mockGetServerStripe.mockReset();
    mockEnsureSessionId.mockReset();
    mockAttachSessionCookie.mockReset();
    mockGetCreditsBalance.mockReset();

    mockEnsureSessionId.mockReturnValue({ sessionId: "session-123", isNew: false });
  });

  afterEach(() => {
    if (originalAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = originalAppUrl;
  });

  it("returns 403 for invalid origin", async () => {
    process.env.APP_URL = "https://trusted.example";

    const request = new NextRequest("https://trusted.example/api/checkout", {
      method: "POST",
      headers: {
        origin: "https://evil.example",
        "content-type": "application/json",
      },
      body: JSON.stringify({ packageId: "credits_50" }),
    });

    const POST = await getCheckoutHandler();
    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(response.headers.get("X-Security-Error")).toContain("not allowed");

    const json = (await response.json()) as { error?: string };
    expect(json.error).toBe("Request blocked by security policy");
  });

  it("returns 503 when Stripe is not configured", async () => {
    mockGetServerStripe.mockReturnValue(null);

    const request = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ packageId: "credits_50" }),
    });

    const POST = await getCheckoutHandler();
    const response = await POST(request);

    expect(response.status).toBe(503);

    const json = (await response.json()) as { error?: string };
    expect(json.error).toContain("Payment system not configured");
  });

  it("returns 400 for invalid request body (schema)", async () => {
    const createCheckoutSession = vi.fn();
    mockGetServerStripe.mockReturnValue({
      checkout: { sessions: { create: createCheckoutSession } },
    });

    const request = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ packageId: "credits_999" }),
    });

    const POST = await getCheckoutHandler();
    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(createCheckoutSession).not.toHaveBeenCalled();

    const json = (await response.json()) as { error?: string };
    expect(json.error).toContain("packageId");
  });

  it("returns a Stripe Checkout URL for a valid package", async () => {
    const createCheckoutSession = vi
      .fn()
      .mockResolvedValue({ url: "https://stripe.example/checkout", id: "cs_test_123" });

    mockGetServerStripe.mockReturnValue({
      checkout: { sessions: { create: createCheckoutSession } },
    });

    const request = new NextRequest("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ packageId: "credits_50" }),
    });

    const POST = await getCheckoutHandler();
    const response = await POST(request);

    expect(response.status).toBe(200);

    const json = (await response.json()) as { url?: string; sessionId?: string };
    expect(json.url).toBe("https://stripe.example/checkout");
    expect(json.sessionId).toBe("cs_test_123");

    expect(createCheckoutSession).toHaveBeenCalledTimes(1);

    const callArgs = createCheckoutSession.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(callArgs.client_reference_id).toBe("session-123");

    const metadata = callArgs.metadata as Record<string, string>;
    expect(metadata.sessionId).toBe("session-123");
    expect(metadata.packageId).toBe("credits_50");
    expect(metadata.credits).toBe("50");
  });
});
