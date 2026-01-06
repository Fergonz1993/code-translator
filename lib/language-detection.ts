// ===== LANGUAGE AUTO-DETECTION =====
// Detect programming language from code content.

const languagePatterns: { language: string; patterns: RegExp[] }[] = [
  {
    language: "typescript",
    patterns: [
      /^import .+ from ['"]|^export (type|interface|const|function|class)/m,
      /: (string|number|boolean|void|any)\b/,
      /interface \w+ \{/,
      /\w+<\w+>/, // Generic types (require identifier before angle brackets)
    ],
  },
  {
    language: "javascript",
    patterns: [
      /^(const|let|var) \w+ = (function|\()/m,
      /^import .+ from ['"]|^export (default )?/m,
      /\b(document|window|console)\./,
      /=>\s*\{/,
    ],
  },
  {
    language: "python",
    patterns: [
      /^(def|class|import|from) /m,
      /:\s*$/m, // Colon at end of line
      /^ {4}\S/m, // 4-space indentation with any non-whitespace
      /\bself\./,
      /^#.*$/m, // Python comments
    ],
  },
  {
    language: "rust",
    patterns: [
      /^(fn|pub|mod|use|struct|impl|enum) /m,
      /-> \w+/,
      /&(mut )?\w+/,
      /let (mut )?\w+/,
      /::new\(/,
    ],
  },
  {
    language: "go",
    patterns: [
      /^(package|import|func|type|var) /m,
      /:= /,
      /\bfmt\./,
      /\bfunc \(\w+ \*?\w+\)/,
    ],
  },
  {
    language: "java",
    patterns: [
      /^(public|private|protected) (static )?(class|void|int|String)/m,
      /System\.out\./,
      /new \w+\(/,
      /@Override/,
    ],
  },
  {
    language: "csharp",
    patterns: [
      /^(public|private|protected|internal) (static )?(class|void|int|string)/m,
      /\busing System/m,
      /Console\.(Write|Read)/,
      /\bvar \w+ = new/,
    ],
  },
  {
    language: "cpp",
    patterns: [
      /^#include\s*[<"]/m,
      /std::/,
      /cout\s*<</,
      /\bint main\(/,
      /::\w+\(/,
    ],
  },
  {
    language: "ruby",
    patterns: [
      /^(def|class|module|require) /m,
      /\bdo \|/,
      /\.each \{/,
      /\bend$/m,
      /@\w+/,
    ],
  },
  {
    language: "php",
    patterns: [
      /^<\?php/m,
      /\$\w+/,
      /function \w+\(/,
      /->\w+/,
      /use \\/,
    ],
  },
  {
    language: "swift",
    patterns: [
      /^(import|func|class|struct|var|let) /m,
      /-> (String|Int|Bool|Void)/,
      /\bguard\b/,
      /\bif let\b/,
    ],
  },
  {
    language: "kotlin",
    patterns: [
      /^(fun|class|data class|object|package) /m,
      /val \w+:/,
      /\bprintln\(/,
      /::\w+/,
    ],
  },
];

// Minimum confidence score to accept a detected language
export const MIN_CONFIDENCE_SCORE = 2;

/**
 * Detect programming language from code content.
 * Returns the detected language or "plaintext" if unknown.
 */
export function detectLanguage(code: string): string {
  // Early return for empty/whitespace input
  if (!code || !code.trim()) {
    return "plaintext";
  }

  const scores: Record<string, number> = {};

  for (const { language, patterns } of languagePatterns) {
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        scores[language] = (scores[language] || 0) + 1;
      }
    }
  }

  // Find language with highest score
  let bestLanguage = "plaintext";
  let bestScore = 0;

  for (const [language, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestLanguage = language;
    }
  }

  // Require minimum matches to be confident
  return bestScore >= MIN_CONFIDENCE_SCORE ? bestLanguage : "plaintext";
}

/**
 * Get Monaco editor language ID from detected language.
 */
export function toMonacoLanguage(language: string): string {
  const mapping: Record<string, string> = {
    csharp: "csharp",
    cpp: "cpp",
    kotlin: "plaintext", // Kotlin not natively supported
    plaintext: "plaintext",
  };

  return mapping[language] || language;
}
