// ===== PROXY (MIDDLEWARE) TESTS =====
// Validates security headers and CSP nonce wiring.

import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

describe("proxy", () => {
  it("adds CSP nonce and security headers", async () => {
    const { proxy } = await import("@/proxy");

    const request = new NextRequest("https://example.com", {
      headers: {
        "user-agent": "vitest",
      },
    });

    const response = proxy(request);

    const nonce = response.headers.get("x-nonce");
    expect(nonce).toBeTruthy();

    const csp = response.headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain(`nonce-${nonce}`);
    expect(csp).toContain("default-src 'self'");

    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(response.headers.get("Permissions-Policy")).toContain("camera=()");
  });
});
