// ===== MOBILE NAVIGATION DRAWER =====
// Slide-out navigation menu for mobile.

"use client";

import { useEffect, type ReactNode } from "react";
import { X, Home, Settings, History, CreditCard, Keyboard, HelpCircle } from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items?: NavItem[];
}

const defaultItems: NavItem[] = [
  { id: "home", label: "Home", icon: <Home className="w-5 h-5" />, onClick: () => {} },
  { id: "history", label: "History", icon: <History className="w-5 h-5" />, onClick: () => {} },
  { id: "settings", label: "Settings", icon: <Settings className="w-5 h-5" />, onClick: () => {} },
  { id: "credits", label: "Buy Credits", icon: <CreditCard className="w-5 h-5" />, onClick: () => {} },
  { id: "shortcuts", label: "Shortcuts", icon: <Keyboard className="w-5 h-5" />, onClick: () => {} },
  { id: "help", label: "Help", icon: <HelpCircle className="w-5 h-5" />, onClick: () => {} },
];

export function MobileDrawer({ isOpen, onClose, items = defaultItems }: MobileDrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="
          absolute left-0 top-0 bottom-0 w-72
          bg-white dark:bg-slate-900
          shadow-2xl border-r border-slate-200 dark:border-slate-700
          animate-in slide-in-from-left duration-300
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Menu
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className="
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                text-slate-700 dark:text-slate-300
                hover:bg-slate-100 dark:hover:bg-slate-800
                transition-colors
              "
            >
              <span className="text-slate-400">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-400 text-center">
            Code Translator v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
