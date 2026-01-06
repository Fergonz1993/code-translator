import { describe, it, expect, vi } from "vitest";
import { buildTranslateLog, logTranslateEvent } from "@/lib/translate-logger";

describe("buildTranslateLog", () => {
  it("normalizes cached to false when missing", () => {
    const entry = buildTranslateLog({
      event: "translate",
      status: "success",
      requestId: "req-1",
      model: "gpt-4o-mini",
      provider: "openai",
      latencyMs: 123,
    });

    expect(entry.cached).toBe(false);
    expect(entry.model).toBe("gpt-4o-mini");
  });
});

describe("logTranslateEvent", () => {
  it("logs success to console.info", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logTranslateEvent({
      event: "translate",
      status: "success",
      requestId: "req-2",
      model: "gpt-4o-mini",
      provider: "openai",
      latencyMs: 50,
      cached: true,
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    infoSpy.mockRestore();
  });

  it("logs errors to console.error", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logTranslateEvent({
      event: "translate",
      status: "error",
      requestId: "req-3",
      model: "gpt-4o-mini",
      provider: "openai",
      latencyMs: 50,
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });
});
