// ===== PROMPT BUILDER SERVICE =====
// Builds prompts for AI translation requests.

// ===== BUILD TRANSLATION PROMPT =====

export function buildTranslationPrompt(options: {
    code: string;
    language: string;
    lineNumbers: number[];
    lines: string[];
    strict?: boolean;
}): string {
    const linesBlock = options.lineNumbers
        .map((lineNumber) => `${lineNumber}: ${options.lines[lineNumber - 1] ?? ""}`)
        .join("\n");

    return `You are a code-to-English translator. Translate the requested ${options.language} lines into plain English, line by line.

RULES:
- Return ONLY a valid JSON array, no markdown, no code fences
- Each object must include "lineNumber" and "english"
- Use the provided line numbers exactly
- Keep explanations SHORT (10-15 words max)
- Use simple, everyday language (like explaining to someone who doesn't code)
- For blank lines, return "---"
- For comments, say "Note: [what the comment says]"
- For closing braces/brackets alone, say "End of [what block it closes]"
- NO technical jargon
- Focus on WHAT it does, not HOW it works technically
${options.strict ? "- If you are unsure, still return a best-effort English explanation" : ""}

TRANSLATE ONLY THESE LINES:
${linesBlock}

FULL CODE (for context):
${options.code}
`;
}

// ===== LINE HELPERS =====

export function splitCodeLines(code: string): string[] {
    return code.split(/\r?\n/);
}

export function normalizeLineNumbers(
    lineNumbers: number[] | undefined,
    totalLines: number
): number[] {
    const fallback = Array.from({ length: totalLines }, (_, i) => i + 1);
    const raw = lineNumbers && lineNumbers.length > 0 ? lineNumbers : fallback;
    const normalized = raw
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value))
        .map((value) => Math.trunc(value))
        .filter((value) => value >= 1 && value <= totalLines);

    return Array.from(new Set(normalized)).sort((a, b) => a - b);
}

export function identifyBlankLines(
    lines: string[],
    lineNumbers: number[]
): { blankLines: Set<number>; nonBlankLines: number[] } {
    const blankLines = new Set<number>();
    const nonBlankLines: number[] = [];

    for (const lineNumber of lineNumbers) {
        const lineContent = lines[lineNumber - 1] ?? "";
        if (lineContent.trim() === "") {
            blankLines.add(lineNumber);
        } else {
            nonBlankLines.push(lineNumber);
        }
    }

    return { blankLines, nonBlankLines };
}
