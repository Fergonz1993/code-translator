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

  it("throws early based on the content-length header", async () => {
    const fakeRequest = {
      headers: new Headers({ "content-length": "101" }),
      body: null,
      arrayBuffer: async () => new TextEncoder().encode("{}").buffer,
    } as unknown as Request;

    await expect(readJsonBodyWithLimit(fakeRequest, 100)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
  });

  it("ignores invalid content-length values", async () => {
    const fakeRequest = {
      headers: new Headers({ "content-length": "not-a-number" }),
      body: null,
      arrayBuffer: async () =>
        new TextEncoder().encode(JSON.stringify({ ok: true })).buffer,
    } as unknown as Request;

    const json = await readJsonBodyWithLimit(fakeRequest, 10_000);
    expect(json).toEqual({ ok: true });
  });

  it("ignores negative content-length values", async () => {
    const fakeRequest = {
      headers: new Headers({ "content-length": "-1" }),
      body: null,
      arrayBuffer: async () =>
        new TextEncoder().encode(JSON.stringify({ ok: true })).buffer,
    } as unknown as Request;

    const json = await readJsonBodyWithLimit(fakeRequest, 10_000);
    expect(json).toEqual({ ok: true });
  });

  it("uses arrayBuffer fallback and rejects oversize payloads", async () => {
    const bytes = new Uint8Array(101);
    const fakeRequest = {
      headers: new Headers(),
      body: null,
      arrayBuffer: async () => bytes.buffer,
    } as unknown as Request;

    await expect(readJsonBodyWithLimit(fakeRequest, 100)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
  });

  it("throws InvalidJsonBodyError for blank bodies", async () => {
    const fakeRequest = {
      headers: new Headers(),
      body: null,
      arrayBuffer: async () => new TextEncoder().encode("   ").buffer,
    } as unknown as Request;

    await expect(readJsonBodyWithLimit(fakeRequest, 10_000)).rejects.toBeInstanceOf(
      InvalidJsonBodyError
    );
  });

  it("handles streams that yield empty chunks", async () => {
    const reads: Array<{ done: boolean; value?: Uint8Array }> = [
      { done: false, value: undefined },
      { done: true, value: undefined },
    ];

    const fakeRequest = {
      headers: new Headers(),
      body: {
        getReader: () => ({
          read: async () => reads.shift() ?? { done: true, value: undefined },
        }),
      },
      arrayBuffer: async () => new ArrayBuffer(0),
    } as unknown as Request;

    await expect(readJsonBodyWithLimit(fakeRequest, 10_000)).rejects.toBeInstanceOf(
      InvalidJsonBodyError
    );
  });
});
