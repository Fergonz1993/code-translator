import { describe, it, expect, vi } from "vitest";
import { buildCreditsLog, logCreditsEvent } from "@/lib/credits-logger";

describe("buildCreditsLog", () => {
  it("includes core fields in the payload", () => {
    const entry = buildCreditsLog({
      event: "credits",
      action: "consume",
      requestId: "req-credits-1",
      amount: 1,
      source: "translation",
      remaining: 19,
    });

    expect(entry).toEqual({
      event: "credits",
      action: "consume",
      requestId: "req-credits-1",
      amount: 1,
      source: "translation",
      remaining: 19,
    });
  });
});

describe("logCreditsEvent", () => {
  it("logs credits events to console.info", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logCreditsEvent({
      event: "credits",
      action: "refund",
      requestId: "req-credits-2",
      amount: 1,
      source: "translation_refund",
      remaining: 20,
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    infoSpy.mockRestore();
  });
});
