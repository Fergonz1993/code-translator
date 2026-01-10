// ===== AI TRANSLATOR TESTS =====
// These tests cover the small but important "routing" logic:
// - Model → provider mapping
// - Model ID mapping (especially Claude model names)
// - API key resolution (BYOK vs server-side keys)
//
// We intentionally do NOT test real network calls here.

import { describe, it, expect } from "vitest";
import { getModelId, getProviderForModel, resolveApiKey } from "@/lib/services/ai-translator";

describe("ai-translator", () => {
  describe("getProviderForModel", () => {
    it("routes GPT models to OpenAI", () => {
      expect(getProviderForModel("gpt-4o-mini")).toBe("openai");
      expect(getProviderForModel("gpt-4o")).toBe("openai");
    });

    it("routes Gemini models to Google", () => {
      expect(getProviderForModel("gemini-2.0-flash")).toBe("google");
      expect(getProviderForModel("gemini-1.5-flash")).toBe("google");
    });

    it("routes Claude models to Anthropic", () => {
      expect(getProviderForModel("claude-haiku")).toBe("anthropic");
      expect(getProviderForModel("claude-sonnet")).toBe("anthropic");
    });
  });

  describe("getModelId", () => {
    it("maps Claude IDs to the provider-specific model strings", () => {
      expect(getModelId("claude-haiku")).toBe("claude-3-5-haiku-latest");
      expect(getModelId("claude-sonnet")).toBe("claude-sonnet-4-20250514");
    });

    it("leaves non-Claude model IDs unchanged", () => {
      expect(getModelId("gpt-4o-mini")).toBe("gpt-4o-mini");
      expect(getModelId("gemini-2.0-flash")).toBe("gemini-2.0-flash");
    });
  });

  describe("resolveApiKey", () => {
    it("returns a user key (BYOK) when provided", () => {
      const result = resolveApiKey("gpt-4o-mini", `sk-${"a".repeat(40)}`);
      expect(result).not.toBeNull();
      expect(result!.isUserKey).toBe(true);
      expect(result!.apiKey.startsWith("sk-")).toBe(true);
    });

    it("throws for suspicious user keys (whitespace)", () => {
      expect(() =>
        resolveApiKey("gpt-4o-mini", ` sk-${"a".repeat(40)}`)
      ).toThrow("Invalid API key format.");
    });

    it("throws for suspicious user keys (wrong prefix)", () => {
      expect(() =>
        resolveApiKey("gpt-4o-mini", `bad-${"a".repeat(40)}`)
      ).toThrow("Invalid API key format.");
    });

    it("falls back to server-side env key when user key is missing", () => {
      const original = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = `sk-${"b".repeat(40)}`;

      try {
        const result = resolveApiKey("gpt-4o-mini");
        expect(result).not.toBeNull();
        expect(result!.isUserKey).toBe(false);
        expect(result!.apiKey).toBe(process.env.OPENAI_API_KEY);
      } finally {
        if (original === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = original;
      }
    });

    it("returns null if neither user key nor env key exists", () => {
      const original = process.env.GOOGLE_API_KEY;
      delete process.env.GOOGLE_API_KEY;

      try {
        const result = resolveApiKey("gemini-2.0-flash");
        expect(result).toBeNull();
      } finally {
        if (original !== undefined) process.env.GOOGLE_API_KEY = original;
      }
    });
  });
});

