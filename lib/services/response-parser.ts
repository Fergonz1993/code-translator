// ===== RESPONSE PARSER SERVICE =====
// Parses and validates AI translation responses.

// ===== CONSTANTS =====

export const DEFAULT_PLACEHOLDER = "(translation unavailable)";

// ===== HELPERS =====

function extractJsonArray(content: string): string {
    const cleaned = content
        .replace(/^```(?:json)?\s*/gm, "")
        .replace(/```\s*$/gm, "")
        .trim();

    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");

    if (start !== -1 && end !== -1 && end > start) {
        return cleaned.slice(start, end + 1);
    }

    return cleaned;
}

// ===== MAIN PARSER =====

export function parseTranslationResponse(
    content: string,
    expectedLineNumbers: number[],
    lines: string[]
): Map<number, string> {
    if (!content || content.trim() === "") {
        throw new Error("Empty response from AI provider");
    }

    const cleaned = extractJsonArray(content);

    let parsed: unknown;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        throw new Error("AI returned invalid JSON. Please try again.");
    }

    if (!Array.isArray(parsed)) {
        throw new Error("AI response is not an array. Please try again.");
    }

    const remaining = new Set(expectedLineNumbers);
    const lineTextMap = new Map<string, number[]>();

    for (const lineNumber of expectedLineNumbers) {
        const lineText = lines[lineNumber - 1] ?? "";
        const list = lineTextMap.get(lineText);
        if (list) {
            list.push(lineNumber);
        } else {
            lineTextMap.set(lineText, [lineNumber]);
        }
    }

    const translations = new Map<number, string>();

    for (const item of parsed) {
        if (typeof item !== "object" || item === null) continue;

        const record = item as {
            lineNumber?: number | string;
            line?: string;
            english?: string;
        };

        if (typeof record.english !== "string") continue;

        let lineNumber: number | null = null;

        if (typeof record.lineNumber === "number" && Number.isFinite(record.lineNumber)) {
            lineNumber = Math.trunc(record.lineNumber);
        } else if (typeof record.lineNumber === "string") {
            const parsedNumber = Number(record.lineNumber);
            if (Number.isFinite(parsedNumber)) {
                lineNumber = Math.trunc(parsedNumber);
            }
        }

        if (lineNumber && remaining.has(lineNumber)) {
            translations.set(lineNumber, record.english);
            remaining.delete(lineNumber);
            continue;
        }

        if (!lineNumber && typeof record.line === "string") {
            const candidates = lineTextMap.get(record.line);
            if (candidates && candidates.length > 0) {
                const fallbackLineNumber = candidates.shift();
                if (fallbackLineNumber && remaining.has(fallbackLineNumber)) {
                    translations.set(fallbackLineNumber, record.english);
                    remaining.delete(fallbackLineNumber);
                }
            }
        }
    }

    return translations;
}
