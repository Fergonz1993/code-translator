// ===== STRIPE SERVER TESTS =====
// Ensures server-side Stripe initialization behaves predictably.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("stripe-server", () => {
  const originalKey = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = originalKey;
  });

  it("returns null and warns when STRIPE_SECRET_KEY is missing", async () => {
    delete process.env.STRIPE_SECRET_KEY;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getServerStripe } = await import("@/lib/stripe-server");

    expect(getServerStripe()).toBeNull();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it("caches the Stripe instance when configured", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getServerStripe } = await import("@/lib/stripe-server");

    const first = getServerStripe();
    const second = getServerStripe();

    expect(first).not.toBeNull();
    expect(second).toBe(first);
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
