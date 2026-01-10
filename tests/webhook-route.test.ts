// ===== /api/webhook ROUTE TESTS =====
// Route-level tests for Stripe webhook handling.
//
// Goal:
// - Validate stable status codes for common failure modes.
// - Avoid real Stripe network calls.
// - Avoid touching real SQLite.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

// ===== MOCKS =====

const mockGetServerStripe = vi.fn();
const mockGrantCredits = vi.fn();

vi.mock("@/lib/stripe-server", () => {
  return {
    getServerStripe: () => mockGetServerStripe(),
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

async function getWebhookHandler() {
  const module = await import("@/app/api/webhook/route");
  return module.POST;
}

describe("POST /api/webhook", () => {
  const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.resetModules();

    mockGetServerStripe.mockReset();
    mockGrantCredits.mockReset();

    // Default: Stripe configured.
    mockGetServerStripe.mockReturnValue({
      webhooks: {
        constructEvent: vi.fn(),
      },
    });
  });

  afterEach(() => {
    if (originalWebhookSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
  });

  it("returns 503 when Stripe is not configured", async () => {
    mockGetServerStripe.mockReturnValue(null);

    const request = new NextRequest("https://example.com/api/webhook", {
      method: "POST",
      body: "{}",
    });

    const POST = await getWebhookHandler();
    const response = await POST(request);

    expect(response.status).toBe(503);
    const json = (await response.json()) as { error?: string };
    expect(json.error).toBe("Stripe not configured");
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const request = new NextRequest("https://example.com/api/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: "{}",
    });

    const POST = await getWebhookHandler();
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = (await response.json()) as { error?: string };
    expect(json.error).toBe("Missing signature");
  });

  it("returns 503 when STRIPE_WEBHOOK_SECRET is missing", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const request = new NextRequest("https://example.com/api/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=fake",
      },
      body: "{}",
    });

    const POST = await getWebhookHandler();
    const response = await POST(request);

    expect(response.status).toBe(503);
    const json = (await response.json()) as { error?: string };
    expect(json.error).toBe("Webhook not configured");
  });

  it("returns 400 when signature verification fails", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    const stripe = {
      webhooks: {
        constructEvent: vi.fn(() => {
          throw new Error("bad signature");
        }),
      },
    };
    mockGetServerStripe.mockReturnValue(stripe);

    const request = new NextRequest("https://example.com/api/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=fake",
      },
      body: "{}",
    });

    const POST = await getWebhookHandler();
    const response = await POST(request);

    expect(response.status).toBe(400);
    const json = (await response.json()) as { error?: string };
    expect(json.error).toBe("Invalid signature");
    expect(mockGrantCredits).not.toHaveBeenCalled();
  });

  it("grants credits for a paid checkout.session.completed event", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

    const stripe = {
      webhooks: {
        constructEvent: vi.fn(() => {
          return {
            type: "checkout.session.completed",
            data: {
              object: {
                id: "cs_test_123",
                payment_status: "paid",
                metadata: {
                  credits: "50",
                  sessionId: "session-123",
                },
              },
            },
          };
        }),
      },
    };
    mockGetServerStripe.mockReturnValue(stripe);

    const request = new NextRequest("https://example.com/api/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=fake",
      },
      body: "{}",
    });

    const POST = await getWebhookHandler();
    const response = await POST(request);

    expect(response.status).toBe(200);
    const json = (await response.json()) as { received?: boolean };
    expect(json.received).toBe(true);

    expect(mockGrantCredits).toHaveBeenCalledTimes(1);
    expect(mockGrantCredits).toHaveBeenCalledWith({
      sessionId: "session-123",
      amount: 50,
      source: "stripe_webhook",
      idempotencyKey: "stripe:cs_test_123",
    });
  });
});
