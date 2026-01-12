// ===== SECURITY UTILITIES TESTS =====
// Covers origin validation and app URL resolution.

import { describe, it, expect, afterEach } from "vitest";

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

describe("security", () => {
  const envSnapshot = snapshotEnv(["APP_URL", "ALLOWED_ORIGINS"]);

  afterEach(() => {
    restoreEnv(envSnapshot);
  });

  it("getAppUrl returns APP_URL when set", async () => {
    process.env.APP_URL = "https://trusted.example";
    const { getAppUrl } = await import("@/lib/security");
    expect(getAppUrl()).toBe("https://trusted.example");
  });

  it("getAppUrl falls back to localhost when not in production", async () => {
    delete process.env.APP_URL;

    const originalNodeEnv = (process.env as any).NODE_ENV;
    (process.env as any).NODE_ENV = "development";

    try {
      const { getAppUrl } = await import("@/lib/security");
      expect(getAppUrl()).toBe("http://localhost:3000");
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
    }
  });

  it("getAppUrl returns null in production when APP_URL is missing", async () => {
    delete process.env.APP_URL;

    const originalNodeEnv = (process.env as any).NODE_ENV;
    (process.env as any).NODE_ENV = "production";

    try {
      const { getAppUrl } = await import("@/lib/security");
      expect(getAppUrl()).toBeNull();
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
    }
  });

  it("validateOrigin accepts exact APP_URL origin", async () => {
    process.env.APP_URL = "https://trusted.example";

    const { validateOrigin } = await import("@/lib/security");

    const request = new Request("https://trusted.example/api/test", {
      headers: {
        origin: "https://trusted.example",
      },
    }) as unknown as import("next/server").NextRequest;

    const result = validateOrigin(request);
    expect(result.valid).toBe(true);
    expect(result.origin).toBe("https://trusted.example");
  });

  it("validateOrigin accepts referer origin when origin header is missing (production)", async () => {
    process.env.APP_URL = "https://trusted.example";

    const originalNodeEnv = (process.env as any).NODE_ENV;
    (process.env as any).NODE_ENV = "production";

    try {
      const { validateOrigin } = await import("@/lib/security");

      const request = new Request("https://trusted.example/api/test", {
        headers: {
          referer: "https://trusted.example/some/page",
        },
      }) as unknown as import("next/server").NextRequest;

      const result = validateOrigin(request);
      expect(result.valid).toBe(true);
      expect(result.origin).toBe("https://trusted.example");
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
    }
  });

  it("validateOrigin rejects invalid referer values (production)", async () => {
    process.env.APP_URL = "https://trusted.example";

    const originalNodeEnv = (process.env as any).NODE_ENV;
    (process.env as any).NODE_ENV = "production";

    try {
      const { validateOrigin } = await import("@/lib/security");

      const request = new Request("https://trusted.example/api/test", {
        headers: {
          referer: "not-a-url",
        },
      }) as unknown as import("next/server").NextRequest;

      const result = validateOrigin(request);
      expect(result.valid).toBe(false);
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
    }
  });

  it("validateOrigin accepts additional allowed origins from env", async () => {
    process.env.APP_URL = "https://trusted.example";
    process.env.ALLOWED_ORIGINS = "https://alt.example";

    const { validateOrigin } = await import("@/lib/security");

    const request = new Request("https://trusted.example/api/test", {
      headers: {
        origin: "https://alt.example",
      },
    }) as unknown as import("next/server").NextRequest;

    const result = validateOrigin(request);
    expect(result.valid).toBe(true);
    expect(result.origin).toBe("https://alt.example");
  });

  it("validateOrigin rejects requests in production when APP_URL is missing", async () => {
    delete process.env.APP_URL;

    const originalNodeEnv = (process.env as any).NODE_ENV;
    (process.env as any).NODE_ENV = "production";

    try {
      const { validateOrigin } = await import("@/lib/security");

      const request = new Request("https://example.com/api/test", {
        headers: {
          origin: "https://example.com",
        },
      }) as unknown as import("next/server").NextRequest;

      const result = validateOrigin(request);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("APP_URL not set");
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
    }
  });

  it("validateOrigin allows requests without origin in development", async () => {
    delete process.env.APP_URL;

    const originalNodeEnv = (process.env as any).NODE_ENV;
    (process.env as any).NODE_ENV = "development";

    try {
      const { validateOrigin } = await import("@/lib/security");

      const request = new Request("http://localhost:3000/api/test") as unknown as import(
        "next/server"
      ).NextRequest;

      const result = validateOrigin(request);
      expect(result.valid).toBe(true);
      expect(result.origin).toBeNull();
    } finally {
      (process.env as any).NODE_ENV = originalNodeEnv;
    }
  });

  it("createOriginErrorResponse returns 403 and sets X-Security-Error", async () => {
    const { createOriginErrorResponse } = await import("@/lib/security");

    const response = createOriginErrorResponse("Origin 'x' not allowed");
    expect(response.status).toBe(403);
    expect(response.headers.get("X-Security-Error")).toBe("Origin 'x' not allowed");

    const json = (await response.json()) as { error?: string };
    expect(json.error).toBe("Request blocked by security policy");
  });
});
