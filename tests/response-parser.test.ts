// ===== RESPONSE PARSER TESTS =====
// These tests lock in the current behavior of the AI response parser.
//
// Why this matters:
// - AI providers sometimes return extra text, markdown fences, or partial JSON.
// - The parser has fallback logic (match by line text) for when line numbers are missing.
// - We want refactors to stay behavior-identical.

import { describe, it, expect } from "vitest";
import { parseTranslationResponse } from "@/lib/services/response-parser";

describe("response-parser", () => {
  it("parses a JSON array wrapped in markdown code fences", () => {
    const content = [
      "```json",
      '[{"lineNumber":1,"english":"Explain line 1"}]',
      "```",
    ].join("\n");

    const result = parseTranslationResponse(content, [1], ["const x = 1;"]);
    expect(result.get(1)).toBe("Explain line 1");
  });

  it("extracts the JSON array from surrounding extra text", () => {
    const content = [
      "Sure — here are the translations:",
      '[{"lineNumber":1,"english":"Define x as 1"}]',
      "Thanks!",
    ].join("\n");

    const result = parseTranslationResponse(content, [1], ["const x = 1;"]);
    expect(result.get(1)).toBe("Define x as 1");
  });

  it("throws a clear error for empty content", () => {
    expect(() => parseTranslationResponse("", [1], ["const x = 1;"])).toThrow(
      "Empty response from AI provider"
    );
  });

  it("throws a clear error for invalid JSON", () => {
    const content = "[this is not valid json]";
    expect(() => parseTranslationResponse(content, [1], ["const x = 1;"])).toThrow(
      "AI returned invalid JSON. Please try again."
    );
  });

  it("ignores items without an english string", () => {
    const content = '[{"lineNumber":1,"line":"const x = 1;"}]';
    const result = parseTranslationResponse(content, [1], ["const x = 1;"]);
    expect(result.size).toBe(0);
  });

  it("uses line text fallback when lineNumber is missing", () => {
    const lines = ["foo()", "bar()"];
    const expectedLineNumbers = [1, 2];

    // No lineNumber fields at all. The parser should match by `line`.
    const content = JSON.stringify([
      { line: "bar()", english: "Call bar." },
      { line: "foo()", english: "Call foo." },
    ]);

    const result = parseTranslationResponse(content, expectedLineNumbers, lines);
    expect(result.get(1)).toBe("Call foo.");
    expect(result.get(2)).toBe("Call bar.");
  });

  it("assigns duplicate line text translations in order (stable fallback)", () => {
    const lines = ["same()", "same()"];
    const expectedLineNumbers = [1, 2];

    const content = JSON.stringify([
      { line: "same()", english: "First occurrence." },
      { line: "same()", english: "Second occurrence." },
    ]);

    const result = parseTranslationResponse(content, expectedLineNumbers, lines);
    expect(result.get(1)).toBe("First occurrence.");
    expect(result.get(2)).toBe("Second occurrence.");
  });

  it("ignores translations for line numbers that were not requested", () => {
    const content = '[{"lineNumber":999,"english":"Should be ignored"}]';
    const result = parseTranslationResponse(content, [1], ["const x = 1;"]);
    expect(result.size).toBe(0);
  });
});

