import { describe, it, expect, vi, afterEach } from "vitest";
import { buildApiLog, logApiEvent, createApiLogger } from "@/lib/api-logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildApiLog", () => {
  it("includes core fields in the payload", () => {
    const entry = buildApiLog({
      event: "api",
      route: "/api/test",
      method: "GET",
      status: 200,
      requestId: "req-1",
      latencyMs: 42,
    });

    expect(entry).toEqual({
      event: "api",
      route: "/api/test",
      method: "GET",
      status: 200,
      requestId: "req-1",
      latencyMs: 42,
    });
  });
});

describe("logApiEvent", () => {
  it("logs success responses to console.info", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logApiEvent({
      event: "api",
      route: "/api/test",
      method: "POST",
      status: 200,
      requestId: "req-2",
      latencyMs: 10,
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
  });

  it("logs client errors to console.warn", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logApiEvent({
      event: "api",
      route: "/api/test",
      method: "POST",
      status: 400,
      requestId: "req-3",
      latencyMs: 10,
      error: "Bad request",
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("logs server errors to console.error", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logApiEvent({
      event: "api",
      route: "/api/test",
      method: "POST",
      status: 500,
      requestId: "req-4",
      latencyMs: 10,
      error: "Server error",
    });

    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});

describe("createApiLogger", () => {
  it("computes latency from the start time", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(Date, "now").mockReturnValue(200);

    const logApi = createApiLogger({
      route: "/api/test",
      method: "GET",
      requestId: "req-5",
      startTime: 150,
    });

    logApi({ status: 200 });

    const logged = JSON.parse(infoSpy.mock.calls[0][0]);
    expect(logged.latencyMs).toBe(50);
  });
});
