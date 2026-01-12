// ===== SESSION TESTS =====
// Minimal tests to lock in session cookie signing/verification behavior.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

function extractCookieValue(setCookieHeader: string, cookieName: string): string {
  const match = setCookieHeader.match(new RegExp(`${cookieName}=([^;]+)`));
  if (!match?.[1]) {
    throw new Error(`Expected Set-Cookie header to include ${cookieName}`);
  }
  return match[1];
}

describe("session", () => {
  const originalSecret = process.env.SESSION_SECRET;

  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = "test-session-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = originalSecret;
  });

  it("attaches a signed HttpOnly cookie and reads it back", async () => {
    const { attachSessionCookie, getSessionId } = await import("@/lib/session");

    const sessionId = "session-id-123";
    const response = NextResponse.json({ ok: true });
    attachSessionCookie(response, sessionId);

    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();

    // Security attributes
    expect(setCookie!).toContain("HttpOnly");
    expect(setCookie!).toMatch(/SameSite=Lax/i);
    expect(setCookie!).toContain("Path=/");

    const shouldBeSecure = process.env.NODE_ENV === "production";
    if (shouldBeSecure) expect(setCookie!).toContain("Secure");
    else expect(setCookie!).not.toContain("Secure");

    const cookieValue = extractCookieValue(setCookie!, "ct_session");
    const request = new NextRequest("https://example.com", {
      headers: { cookie: `ct_session=${cookieValue}` },
    });

    expect(getSessionId(request)).toBe(sessionId);
  });

  it("returns null for tampered session cookies", async () => {
    const { attachSessionCookie, getSessionId } = await import("@/lib/session");

    const response = NextResponse.json({ ok: true });
    attachSessionCookie(response, "session-id-123");

    const setCookie = response.headers.get("set-cookie") ?? "";
    const cookieValue = extractCookieValue(setCookie, "ct_session");

    // Cookie format is: <sessionId>.<signature>
    const tampered = cookieValue.replace("session-id-123", "session-id-456");

    const request = new NextRequest("https://example.com", {
      headers: { cookie: `ct_session=${tampered}` },
    });

    expect(getSessionId(request)).toBeNull();
  });

  it("returns null for malformed cookies", async () => {
    const { getSessionId } = await import("@/lib/session");

    const request = new NextRequest("https://example.com", {
      headers: { cookie: "ct_session=not-signed" },
    });

    expect(getSessionId(request)).toBeNull();
  });

  it("returns null when cookie signature length is invalid", async () => {
    const { getSessionId } = await import("@/lib/session");

    const request = new NextRequest("https://example.com", {
      headers: { cookie: "ct_session=session-id-123.abcd" },
    });

    expect(getSessionId(request)).toBeNull();
  });

  it("creates a new sessionId when none exists", async () => {
    const { ensureSessionId } = await import("@/lib/session");

    const request = new NextRequest("https://example.com");
    const result = ensureSessionId(request);

    expect(result.isNew).toBe(true);
    expect(typeof result.sessionId).toBe("string");
    expect(result.sessionId.length).toBeGreaterThan(10);
  });

  it("reuses an existing session cookie", async () => {
    const { attachSessionCookie, ensureSessionId } = await import("@/lib/session");

    const response = NextResponse.json({ ok: true });
    attachSessionCookie(response, "session-id-123");

    const setCookie = response.headers.get("set-cookie") ?? "";
    const cookieValue = extractCookieValue(setCookie, "ct_session");

    const request = new NextRequest("https://example.com", {
      headers: { cookie: `ct_session=${cookieValue}` },
    });

    const result = ensureSessionId(request);
    expect(result.isNew).toBe(false);
    expect(result.sessionId).toBe("session-id-123");
  });

  it("uses a dev-only fallback secret when SESSION_SECRET is missing", async () => {
    delete process.env.SESSION_SECRET;
    vi.resetModules();

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { attachSessionCookie } = await import("@/lib/session");
    const response = NextResponse.json({ ok: true });
    attachSessionCookie(response, "session-id-123");

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("exits in production when SESSION_SECRET is missing", async () => {
    delete process.env.SESSION_SECRET;

    const originalNodeEnv = (process.env as any).NODE_ENV;
    (process.env as any).NODE_ENV = "production";

    try {
      vi.resetModules();

      const exitSpy = vi
        .spyOn(process, "exit")
        .mockImplementation(((code?: number) => {
          throw new Error(`exit:${code}`);
        }) as any);

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      await expect(import("@/lib/session")).rejects.toThrow("exit:1");
      expect(errorSpy).toHaveBeenCalledWith(
        "SESSION_SECRET is required in production."
      );

      exitSpy.mockRestore();
      errorSpy.mockRestore();
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
    }
  });

  it("uses the production SESSION_SECRET when configured", async () => {
    const originalNodeEnv = (process.env as any).NODE_ENV;
    (process.env as any).NODE_ENV = "production";

    try {
      vi.resetModules();
      process.env.SESSION_SECRET = "prod-secret";

      const { attachSessionCookie } = await import("@/lib/session");
      const crypto = await import("node:crypto");

      const sessionId = "session-id-123";
      const response = NextResponse.json({ ok: true });
      attachSessionCookie(response, sessionId);

      const setCookie = response.headers.get("set-cookie") ?? "";
      const cookieValue = extractCookieValue(setCookie, "ct_session");

      const expectedSignature = crypto
        .createHmac("sha256", "prod-secret")
        .update(sessionId)
        .digest("hex");

      expect(cookieValue).toBe(`${sessionId}.${expectedSignature}`);
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
    }
  });
});
