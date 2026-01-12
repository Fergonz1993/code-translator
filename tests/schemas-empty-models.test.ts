// ===== SCHEMAS: EMPTY MODELS GUARD TEST =====
// This test covers the defensive guard in `lib/schemas.ts`.

import { describe, it, expect, afterEach, vi } from "vitest";

describe("schemas (defensive guards)", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unmock("@/lib/types");
  });

  it("throws if AVAILABLE_MODELS is empty", async () => {
    vi.resetModules();

    vi.doMock("@/lib/types", () => {
      return {
        AVAILABLE_MODELS: [],
      };
    });

    await expect(import("@/lib/schemas")).rejects.toThrow(
      "AVAILABLE_MODELS must contain at least one model"
    );
  });
});
