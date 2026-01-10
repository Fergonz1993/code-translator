import { describe, it, expect } from "vitest";
import {
  toAppError,
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
});
