// ===== CONSTANTS =====
// Centralized constants for the application.

// ===== TIMING =====
export const DEBOUNCE_MS = 800; // Delay before auto-translate
export const REQUEST_TIMEOUT_MS = 30000; // 30 seconds API timeout
export const MESSAGE_HIDE_DELAY_MS = 5000; // Auto-hide notifications
export const URL_CLEANUP_DELAY_MS = 1000; // Delay before cleaning URL params

// ===== CACHING =====
export const CACHE_MAX_ENTRIES = 1000; // Max cached translations
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ===== DATABASE =====
export const SQLITE_BUSY_TIMEOUT_MS = 2500;

// ===== UI =====
export const UNTRANSLATED_PLACEHOLDER = "Not translated yet";
export const BLANK_LINE_MARKER = "---";

// ===== SAMPLE CODE =====
export const SAMPLE_CODE = `function calculatePAR30(loans: Loan[]) {
  const delinquent = loans.filter(loan => loan.dpd > 30);
  const ratio = delinquent.length / loans.length;
  return ratio * 100;
}`;

export const SAMPLE_TRANSLATIONS = [
    {
        lineNumber: 1,
        line: "function calculatePAR30(loans: Loan[]) {",
        english: "Define a function to calculate the PAR30 ratio for loans.",
    },
    {
        lineNumber: 2,
        line: "  const delinquent = loans.filter(loan => loan.dpd > 30);",
        english: "Filter loans to keep those over 30 days past due.",
    },
    {
        lineNumber: 3,
        line: "  const ratio = delinquent.length / loans.length;",
        english: "Compute the fraction of delinquent loans out of all loans.",
    },
    {
        lineNumber: 4,
        line: "  return ratio * 100;",
        english: "Return the ratio as a percentage.",
    },
    {
        lineNumber: 5,
        line: "}",
        english: "End the function.",
    },
];

// ===== BREAKPOINTS =====
export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
} as const;

// ===== API ENDPOINTS =====
export const API_ENDPOINTS = {
    translate: "/api/translate",
    checkout: "/api/checkout",
    creditsBalance: "/api/credits/balance",
    creditsClaim: "/api/credits/claim",
} as const;
