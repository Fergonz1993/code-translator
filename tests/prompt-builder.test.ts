// ===== PROMPT BUILDER TESTS =====
// Covers prompt construction and line helper utilities.

import { describe, it, expect } from "vitest";
import {
  buildTranslationPrompt,
  splitCodeLines,
  normalizeLineNumbers,
  identifyBlankLines,
} from "@/lib/services/prompt-builder";

describe("prompt-builder", () => {
  it("builds a prompt without strict mode", () => {
    const code = "line1\nline2";
    const lines = splitCodeLines(code);

    const prompt = buildTranslationPrompt({
      code,
      language: "typescript",
      lineNumbers: [1],
      lines,
      strict: false,
    });

    expect(prompt).toContain("Translate the requested typescript lines");
    expect(prompt).toContain("TRANSLATE ONLY THESE LINES");
    expect(prompt).toContain("1: line1");
    expect(prompt).not.toContain("best-effort");
  });

  it("builds a prompt with strict mode", () => {
    const code = "a\nb";
    const lines = splitCodeLines(code);

    const prompt = buildTranslationPrompt({
      code,
      language: "javascript",
      lineNumbers: [2],
      lines,
      strict: true,
    });

    expect(prompt).toContain("2: b");
    expect(prompt).toContain("best-effort");
  });

  it("renders missing line content as empty", () => {
    const code = "a\nb";
    const lines = splitCodeLines(code);

    const prompt = buildTranslationPrompt({
      code,
      language: "javascript",
      lineNumbers: [3],
      lines,
    });

    expect(prompt).toContain("3: ");
  });

  it("treats out-of-range lines as blank", () => {
    const lines = ["alpha"];
    const { blankLines, nonBlankLines } = identifyBlankLines(lines, [1, 2]);

    expect(Array.from(blankLines)).toEqual([2]);
    expect(nonBlankLines).toEqual([1]);
  });

  it("splits CRLF and LF consistently", () => {
    expect(splitCodeLines("a\r\nb")).toEqual(["a", "b"]);
    expect(splitCodeLines("a\nb")).toEqual(["a", "b"]);
  });

  it("normalizes line numbers with fallback and de-duplication", () => {
    expect(normalizeLineNumbers(undefined, 3)).toEqual([1, 2, 3]);
    expect(normalizeLineNumbers([], 2)).toEqual([1, 2]);

    const normalized = normalizeLineNumbers([3, 2, 2, 1, 0, 99, 2.2, NaN], 3);
    expect(normalized).toEqual([1, 2, 3]);
  });

  it("identifies blank and non-blank line numbers", () => {
    const lines = ["alpha", "", "  ", "beta"];
    const { blankLines, nonBlankLines } = identifyBlankLines(lines, [1, 2, 3, 4]);

    expect(Array.from(blankLines)).toEqual([2, 3]);
    expect(nonBlankLines).toEqual([1, 4]);
  });
});
