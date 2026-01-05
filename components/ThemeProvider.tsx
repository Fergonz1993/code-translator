// ===== THEME PROVIDER =====
// This component wraps the entire app to provide dark/light mode support.
// We use next-themes because it handles system preferences and prevents 
// that "flash" of white when you refresh a dark page.

"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
