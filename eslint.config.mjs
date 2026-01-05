// ===== ESLINT CONFIGURATION =====
// Simple flat config for Next.js + TypeScript

import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // ===== IGNORES =====
  {
    ignores: [".next/**", "node_modules/**"],
  },

  // ===== BASE RECOMMENDED RULES =====
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ===== CUSTOM RULES =====
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Allow unused vars that start with underscore
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Prefer const over let
      "prefer-const": "warn",
      // Allow any for now (can tighten later)
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
