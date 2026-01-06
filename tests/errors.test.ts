import { describe, it, expect } from "vitest";
import { toAppError, InvalidAPIKeyError, RateLimitError, QuotaExceededError } from "@/lib/errors";

describe("toAppError", () => {
  it("maps invalid API key errors", () => {
    const error = toAppError(new Error("Invalid API key"));
    expect(error).toBeInstanceOf(InvalidAPIKeyError);
    expect(error.statusCode).toBe(401);
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
