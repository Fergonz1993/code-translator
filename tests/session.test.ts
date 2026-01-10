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
});
