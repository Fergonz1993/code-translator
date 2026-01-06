// ===== KBD COMPONENT =====
// Keyboard key indicator for shortcuts.

import type { ReactNode } from "react";

interface KbdProps {
    children: ReactNode;
    className?: string;
}

export function Kbd({ children, className = "" }: KbdProps) {
    return (
        <kbd
            className={`
        inline-flex items-center justify-center
        px-1.5 py-0.5 min-w-[1.5rem]
        text-xs font-mono font-medium
        bg-slate-100 dark:bg-slate-800
        text-slate-700 dark:text-slate-300
        border border-slate-300 dark:border-slate-600
        rounded shadow-sm
        ${className}
      `}
        >
            {children}
        </kbd>
    );
}

// Common shortcuts display
export function ShortcutDisplay({ keys }: { keys: string[] }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {keys.map((key, i) => (
                <span key={i} className="flex items-center">
                    {i > 0 && <span className="text-slate-400 mx-0.5">+</span>}
                    <Kbd>{key}</Kbd>
                </span>
            ))}
        </span>
    );
}
