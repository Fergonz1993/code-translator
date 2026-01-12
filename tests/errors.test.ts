import { describe, it, expect } from "vitest";
import {
  toAppError,
  AppError,
  ValidationError,
  InsufficientCreditsError,
  AIProviderError,
  StripeNotConfiguredError,
  ContextLengthExceededError,
  InvalidAPIKeyError,
  RateLimitError,
  QuotaExceededError,
} from "@/lib/errors";

describe("toAppError", () => {
  it("maps invalid API key errors", () => {
    const error = toAppError(new Error("Invalid API key"));
    expect(error).toBeInstanceOf(InvalidAPIKeyError);
    expect(error.statusCode).toBe(401);
  });

  it("maps context length exceeded errors", () => {
    const rawProviderError = JSON.stringify({
      type: "invalid_request_error",
      code: "context_length_exceeded",
      message: "Your input exceeds the context window of this model.",
    });

    const error = toAppError(new Error(rawProviderError));
    expect(error).toBeInstanceOf(ContextLengthExceededError);
    expect(error.statusCode).toBe(413);
    expect(error.message).toContain("too large");
  });

  it("maps rate limit errors", () => {
    const error = toAppError(new Error("429 rate limit"));
    expect(error).toBeInstanceOf(RateLimitError);
    expect(error.statusCode).toBe(429);
  });

  it("maps quota exceeded errors", () => {
    const error = toAppError(new Error("insufficient_quota"));
    expect(error).toBeInstanceOf(QuotaExceededError);
    expect(error.statusCode).toBe(402);
  });

  it("passes through AppError instances", () => {
    const original = new RateLimitError();
    const error = toAppError(original);
    expect(error).toBe(original);
  });

  it("wraps unknown Error messages", () => {
    const error = toAppError(new Error("Something else"));
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("UNKNOWN_ERROR");
    expect(error.statusCode).toBe(500);
  });

  it("wraps non-Error values", () => {
    const error = toAppError("nope");
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe("UNKNOWN_ERROR");
    expect(error.message).toBe("An unexpected error occurred");
  });
});

describe("error classes", () => {
  it("AppError sets defaults", () => {
    const error = new AppError({ message: "x", code: "X" });
    expect(error.code).toBe("X");
    expect(error.statusCode).toBe(500);
    expect(error.retryable).toBe(false);
  });

  it("ValidationError is a 400", () => {
    const error = new ValidationError("bad");
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.statusCode).toBe(400);
  });

  it("InsufficientCreditsError is a 402", () => {
    const error = new InsufficientCreditsError();
    expect(error.code).toBe("INSUFFICIENT_CREDITS");
    expect(error.statusCode).toBe(402);
  });

  it("AIProviderError defaults to retryable", () => {
    const error = new AIProviderError({ message: "provider down", provider: "openai" });
    expect(error.code).toBe("AI_PROVIDER_ERROR");
    expect(error.statusCode).toBe(502);
    expect(error.retryable).toBe(true);
    expect(error.provider).toBe("openai");
  });

  it("StripeNotConfiguredError is a 503", () => {
    const error = new StripeNotConfiguredError();
    expect(error.code).toBe("STRIPE_NOT_CONFIGURED");
    expect(error.statusCode).toBe(503);
  });
});
