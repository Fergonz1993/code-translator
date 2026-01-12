// ===== /api/credits/balance ROUTE TESTS =====
// Route-level tests without touching the real database.

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";

const mockEnsureSessionId = vi.fn();
const mockAttachSessionCookie = vi.fn();
const mockGetCreditsBalance = vi.fn();

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

vi.mock("@/lib/api-logger", () => {
  return {
    createApiLogger: () => () => {},
  };
});

async function getBalanceHandler() {
  const module = await import("@/app/api/credits/balance/route");
  return module.GET;
}

describe("GET /api/credits/balance", () => {
  beforeEach(() => {
    vi.resetModules();
    mockEnsureSessionId.mockReset();
    mockAttachSessionCookie.mockReset();
    mockGetCreditsBalance.mockReset();

    mockGetCreditsBalance.mockReturnValue({ total: 20, used: 0, remaining: 20 });
  });

  it("returns credits and sets cookie for new sessions", async () => {
    mockEnsureSessionId.mockReturnValue({ sessionId: "session-123", isNew: true });

    const request = new NextRequest("http://localhost:3000/api/credits/balance", {
      method: "GET",
    });

    const GET = await getBalanceHandler();
    const response = await GET(request);

    expect(response.status).toBe(200);

    const json = (await response.json()) as { credits?: unknown };
    expect(json.credits).toEqual({ total: 20, used: 0, remaining: 20 });

    expect(mockAttachSessionCookie).toHaveBeenCalledTimes(1);
    expect(mockAttachSessionCookie).toHaveBeenCalledWith(expect.anything(), "session-123");
  });

  it("returns credits without setting cookie for existing sessions", async () => {
    mockEnsureSessionId.mockReturnValue({ sessionId: "session-123", isNew: false });

    const request = new NextRequest("http://localhost:3000/api/credits/balance", {
      method: "GET",
    });

    const GET = await getBalanceHandler();
    const response = await GET(request);

    expect(response.status).toBe(200);

    const json = (await response.json()) as { credits?: unknown };
    expect(json.credits).toEqual({ total: 20, used: 0, remaining: 20 });

    expect(mockAttachSessionCookie).not.toHaveBeenCalled();
  });
});
