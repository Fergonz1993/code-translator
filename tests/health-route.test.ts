// ===== /api/health ROUTE TESTS =====
// Ensures the health endpoint returns stable status codes.

import { describe, it, expect, afterEach, vi } from "vitest";

function snapshotEnv(keys: string[]): Record<string, string | undefined> {
  const snapshot: Record<string, string | undefined> = {};
  for (const key of keys) snapshot[key] = process.env[key];
  return snapshot;
}

function restoreEnv(snapshot: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

describe("GET /api/health", () => {
  const envSnapshot = snapshotEnv([
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "OPENAI_API_KEY",
    "GOOGLE_API_KEY",
    "ANTHROPIC_API_KEY",
    "npm_package_version",
  ]);

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it("returns healthy when DB + Stripe + at least one AI provider are configured", async () => {
    vi.resetModules();

    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy";
    process.env.OPENAI_API_KEY = "sk_test_dummy";
    process.env.npm_package_version = "9.9.9";

    vi.doMock("@/lib/credits-store", () => {
      return {
        getCreditsBalance: vi.fn(() => ({ total: 20, used: 0, remaining: 20 })),
      };
    });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(200);

    const json = (await response.json()) as any;
    expect(json.status).toBe("healthy");
    expect(json.version).toBe("9.9.9");
    expect(json.checks.database).toBe(true);
    expect(json.checks.stripe).toBe(true);
    expect(json.checks.aiProviders.openai).toBe(true);
  });

  it("returns degraded when DB is OK but Stripe is not configured", async () => {
    vi.resetModules();

    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    process.env.OPENAI_API_KEY = "sk_test_dummy";

    vi.doMock("@/lib/credits-store", () => {
      return {
        getCreditsBalance: vi.fn(() => ({ total: 20, used: 0, remaining: 20 })),
      };
    });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(200);

    const json = (await response.json()) as any;
    expect(json.status).toBe("degraded");
    expect(json.checks.database).toBe(true);
    expect(json.checks.stripe).toBe(false);
  });

  it("returns unhealthy (503) when the DB check fails", async () => {
    vi.resetModules();

    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_dummy";
    process.env.OPENAI_API_KEY = "sk_test_dummy";
    delete process.env.npm_package_version;

    vi.doMock("@/lib/credits-store", () => {
      return {
        getCreditsBalance: vi.fn(() => {
          throw new Error("db down");
        }),
      };
    });

    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(503);

    const json = (await response.json()) as any;
    expect(json.status).toBe("unhealthy");
    expect(json.version).toBe("1.0.0");
    expect(json.checks.database).toBe(false);
  });
});
