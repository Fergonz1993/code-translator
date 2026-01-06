// ===== TEST UTILITIES =====
// Helpers for component and hook testing.

import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactElement, type ReactNode } from "react";
import { vi } from "vitest";
import { ThemeProvider } from "@/components/ThemeProvider";

// ===== CUSTOM RENDER =====
// Wraps components with necessary providers for testing.

interface WrapperOptions {
  theme?: "light" | "dark" | "system";
}

function createWrapper(options: WrapperOptions = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ThemeProvider attribute="class" defaultTheme={options.theme || "light"}>
        {children}
      </ThemeProvider>
    );
  };
}

export function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & WrapperOptions
) {
  const { theme, ...renderOptions } = options || {};

  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: createWrapper({ theme }),
      ...renderOptions,
    }),
  };
}

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };

// ===== MOCK HELPERS =====

export function mockCreditsState(overrides = {}) {
  return {
    total: 100,
    used: 10,
    remaining: 90,
    ...overrides,
  };
}

export function mockSettings(overrides = {}) {
  return {
    paymentMode: "credits" as const,
    selectedModel: "gpt-4o-mini" as const,
    apiKeys: {},
    ...overrides,
  };
}

export function mockTranslation(overrides = {}) {
  return {
    lineNumber: 1,
    line: "const x = 1;",
    english: "Create a constant variable x with value 1.",
    ...overrides,
  };
}

// ===== ASYNC UTILITIES =====

export async function waitForLoadingToFinish() {
  return new Promise((resolve) => setTimeout(resolve, 100));
}

export function createMockFetch(response: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
    status: ok ? 200 : 400,
  });
}
