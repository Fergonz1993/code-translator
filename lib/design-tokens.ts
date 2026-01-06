// ===== DESIGN TOKENS =====
// Centralized design system values.

export const colors = {
    // Brand
    primary: {
        50: "#eff6ff",
        100: "#dbeafe",
        200: "#bfdbfe",
        300: "#93c5fd",
        400: "#60a5fa",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
        800: "#1e40af",
        900: "#1e3a8a",
    },

    // Semantic
    success: {
        light: "#22c55e",
        DEFAULT: "#16a34a",
        dark: "#15803d",
    },
    warning: {
        light: "#facc15",
        DEFAULT: "#eab308",
        dark: "#ca8a04",
    },
    error: {
        light: "#f87171",
        DEFAULT: "#ef4444",
        dark: "#dc2626",
    },
    info: {
        light: "#60a5fa",
        DEFAULT: "#3b82f6",
        dark: "#2563eb",
    },

    // Dark theme
    dark: {
        background: "#0d1117",
        surface: "#161b22",
        border: "#30363d",
        textPrimary: "#f0f6fc",
        textSecondary: "#8b949e",
        accent: "#58a6ff",
        positive: "#3fb950",
        negative: "#f85149",
    },
} as const;

export const spacing = {
    px: "1px",
    0: "0px",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
} as const;

export const typography = {
    fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
    },
    fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
    },
} as const;

export const shadows = {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
} as const;

export const borderRadius = {
    none: "0px",
    sm: "0.125rem",
    DEFAULT: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    full: "9999px",
} as const;

export const transitions = {
    fast: "150ms",
    DEFAULT: "200ms",
    slow: "300ms",
    slower: "500ms",
} as const;

export const zIndex = {
    dropdown: 50,
    modal: 100,
    tooltip: 150,
    toast: 200,
} as const;
