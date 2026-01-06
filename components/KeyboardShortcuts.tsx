// ===== KEYBOARD SHORTCUTS OVERLAY =====
// Display available keyboard shortcuts.

"use client";

import { useState } from "react";
import { Keyboard } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Kbd } from "@/components/ui/Kbd";

interface Shortcut {
  keys: string[];
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["⌘", "K"], description: "Open command palette" },
  { keys: ["⌘", "S"], description: "Save current translation" },
  { keys: ["⌘", ","], description: "Open settings" },
  { keys: ["⌘", "Enter"], description: "Translate now" },
  { keys: ["Esc"], description: "Close modal / Cancel" },
  { keys: ["⌘", "Z"], description: "Undo" },
  { keys: ["⌘", "Shift", "Z"], description: "Redo" },
];

export function KeyboardShortcutsButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        title="Keyboard shortcuts"
      >
        <Keyboard className="w-5 h-5" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Keyboard Shortcuts">
        <div className="space-y-3">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {shortcut.description}
              </span>
              <span className="flex items-center gap-1">
                {shortcut.keys.map((key, j) => (
                  <span key={j} className="flex items-center">
                    {j > 0 && <span className="text-slate-400 mx-0.5">+</span>}
                    <Kbd>{key}</Kbd>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
