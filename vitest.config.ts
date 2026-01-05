// ===== VITEST CONFIGURATION =====
// Test runner configuration for Code Translator

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // ===== ENVIRONMENT =====
    environment: "jsdom", // Simulates browser for React components

    // ===== SETUP FILES =====
    // setupFiles: ["./tests/setup.ts"], // Uncomment when needed

    // ===== INCLUDES =====
    include: ["**/*.test.{ts,tsx}"],

    // ===== COVERAGE =====
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
  resolve: {
    // ===== PATH ALIASES =====
    // Match Next.js path aliases
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});
