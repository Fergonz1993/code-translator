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
    // NOTE: The repo contains many "future/backlog" modules under `lib/` that are not
    // shipped today. We scope coverage to the current production-critical surface:
    // API routes + the libraries they depend on.
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "app/api/**/route.ts",
        "proxy.ts",

        // Core shared libs used by API routes
        "lib/api-errors.ts",
        "lib/api-logger.ts",
        "lib/constants.ts",
        "lib/credits-logger.ts",
        "lib/credits-store.ts",
        "lib/errors.ts",
        "lib/rate-limiter.ts",
        "lib/request-body.ts",
        "lib/schemas.ts",
        "lib/security.ts",
        "lib/session.ts",
        "lib/sqlite.ts",
        "lib/stripe-server.ts",
        "lib/translate-logger.ts",
        "lib/types.ts",

        // Core translation services
        "lib/services/**/*.ts",
      ],
      exclude: ["**/*.d.ts"],

      // Enforce 100% coverage in the scoped surface.
      thresholds: {
        100: true,
      },
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
