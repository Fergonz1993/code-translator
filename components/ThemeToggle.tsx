// ===== THEME TOGGLE COMPONENT =====
// A simple button that switches between light, dark, and system themes.

"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mounting
  // This is like waiting for the building's electricity to be fully stable 
  // before letting you flip the switch.
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-10 h-10" />; // Empty space to prevent jumping
  }

  // Determine which icon to show and what the next theme should be
  const toggleTheme = () => {
    if (theme === "dark") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("dark"); // Default to dark from system if needed
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
      title={`Current: ${theme} - Click to switch`}
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : theme === "light" ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Monitor className="w-5 h-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
