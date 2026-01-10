// ===== REQUEST BODY TESTS =====
// Unit tests for reading JSON bodies with size limits.

import { describe, it, expect } from "vitest";
import {
  readJsonBodyWithLimit,
  RequestBodyTooLargeError,
  InvalidJsonBodyError,
} from "@/lib/request-body";

describe("request-body", () => {
  it("parses a small JSON body", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ ok: true, code: "const x = 1;" }),
    });

    const json = await readJsonBodyWithLimit(request, 10_000);
    expect(json).toEqual({ ok: true, code: "const x = 1;" });
  });

  it("throws RequestBodyTooLargeError when body exceeds limit", async () => {
    const large = "a".repeat(2_000);
    const request = new Request("https://example.com", {
      method: "POST",
      body: JSON.stringify({ code: large }),
    });

    await expect(readJsonBodyWithLimit(request, 100)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
  });

  it("throws InvalidJsonBodyError for invalid JSON", async () => {
    const request = new Request("https://example.com", {
      method: "POST",
      body: "{not valid json",
    });

    await expect(readJsonBodyWithLimit(request, 10_000)).rejects.toBeInstanceOf(
      InvalidJsonBodyError
    );
  });
});
