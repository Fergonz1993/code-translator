// ===== TYPES TESTS =====
// Tests for type definitions and constants

import { describe, it, expect } from "vitest";
import {
  AVAILABLE_MODELS,
  DEFAULT_SETTINGS,
  INITIAL_CREDITS,
  getProviderForModel,
} from "@/lib/types";

describe("AVAILABLE_MODELS", () => {
  it("should have 6 models", () => {
    // We support 6 models: 2 OpenAI, 2 Google, 2 Anthropic
    expect(AVAILABLE_MODELS).toHaveLength(6);
  });

  it("should have exactly one default model", () => {
    const defaults = AVAILABLE_MODELS.filter((m) => m.isDefault);
    expect(defaults).toHaveLength(1);
  });

  it("should have gpt-4o-mini as default", () => {
    const defaultModel = AVAILABLE_MODELS.find((m) => m.isDefault);
    expect(defaultModel?.id).toBe("gpt-4o-mini");
  });

  it("should have all required fields for each model", () => {
    for (const model of AVAILABLE_MODELS) {
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.provider).toBeDefined();
      expect(model.costPer1000).toBeGreaterThan(0);
      expect(model.description).toBeDefined();
    }
  });

  it("should have correct providers for each model", () => {
    const openaiModels = AVAILABLE_MODELS.filter(
      (m) => m.provider === "openai"
    );
    const googleModels = AVAILABLE_MODELS.filter(
      (m) => m.provider === "google"
    );
    const anthropicModels = AVAILABLE_MODELS.filter(
      (m) => m.provider === "anthropic"
    );

    expect(openaiModels).toHaveLength(2);
    expect(googleModels).toHaveLength(2);
    expect(anthropicModels).toHaveLength(2);
  });
});

describe("DEFAULT_SETTINGS", () => {
  it("should use credits as default payment mode", () => {
    expect(DEFAULT_SETTINGS.paymentMode).toBe("credits");
  });

  it("should use gpt-4o-mini as default model", () => {
    expect(DEFAULT_SETTINGS.selectedModel).toBe("gpt-4o-mini");
  });

  it("should have empty API keys by default", () => {
    expect(DEFAULT_SETTINGS.apiKeys).toEqual({});
  });
});

describe("INITIAL_CREDITS", () => {
  it("should give new users 20 free credits", () => {
    expect(INITIAL_CREDITS).toBe(20);
  });
});

describe("getProviderForModel", () => {
  it("returns the provider for known models", () => {
    expect(getProviderForModel("gpt-4o-mini")).toBe("openai");
    expect(getProviderForModel("gemini-2.0-flash")).toBe("google");
    expect(getProviderForModel("claude-haiku")).toBe("anthropic");
  });

  it("falls back based on model prefix for unknown IDs", () => {
    expect(getProviderForModel("gpt-unknown" as any)).toBe("openai");
    expect(getProviderForModel("gemini-unknown" as any)).toBe("google");
    expect(getProviderForModel("something-else" as any)).toBe("anthropic");
  });
});
