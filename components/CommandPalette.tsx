// ===== COMMAND PALETTE COMPONENT =====
// Cmd+K command palette for quick actions.

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Settings, History, Sun, Zap, CreditCard } from "lucide-react";
import { useCmdK } from "@/hooks/useKeyboardShortcut";

interface Command {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  commands: Command[];
}

export function CommandPalette({ commands }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open with Cmd+K
  useCmdK(() => setIsOpen(true));

  // Filter commands
  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            setIsOpen(false);
          }
          break;
        case "Escape":
          setIsOpen(false);
          break;
      }
    },
    [filteredCommands, selectedIndex]
  );

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        role="presentation"
        onClick={() => setIsOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setIsOpen(false);
        }}
      />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
            ESC
          </kbd>
        </div>

        {/* Commands list */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 && (
            <div className="p-4 text-center text-slate-500">No commands found</div>
          )}
          {filteredCommands.map((cmd, index) => (
            <button
              type="button"
              key={cmd.id}
              onClick={() => {
                cmd.action();
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                ${index === selectedIndex
                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }
              `}
            >
              <span className="flex-shrink-0 text-slate-400">{cmd.icon}</span>
              <span className="flex-1">{cmd.label}</span>
              {cmd.shortcut && (
                <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">
                  {cmd.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Platform-aware modifier key
const getModKey = () => 
  typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";

// Default commands factory
export function useDefaultCommands(handlers: {
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onToggleTheme: () => void;
  onBuyCredits: () => void;
  onTranslate: () => void;
}): Command[] {
  const modKey = getModKey();
  
  return [
    {
      id: "settings",
      label: "Open Settings",
      icon: <Settings className="w-4 h-4" />,
      shortcut: `${modKey},`,
      action: handlers.onOpenSettings,
    },
    {
      id: "history",
      label: "View History",
      icon: <History className="w-4 h-4" />,
      action: handlers.onOpenHistory,
    },
    {
      id: "theme",
      label: "Toggle Theme",
      icon: <Sun className="w-4 h-4" />,
      action: handlers.onToggleTheme,
    },
    {
      id: "translate",
      label: "Translate Now",
      icon: <Zap className="w-4 h-4" />,
      shortcut: `${modKey}↵`,
      action: handlers.onTranslate,
    },
    {
      id: "credits",
      label: "Buy Credits",
      icon: <CreditCard className="w-4 h-4" />,
      action: handlers.onBuyCredits,
    },
  ];
}
