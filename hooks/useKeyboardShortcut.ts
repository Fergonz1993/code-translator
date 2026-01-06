// ===== USE KEYBOARD SHORTCUT HOOK =====
// Register keyboard shortcuts with proper cleanup.

"use client";

import { useEffect, useCallback } from "react";

interface ShortcutOptions {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    preventDefault?: boolean;
}

export function useKeyboardShortcut(
    shortcut: ShortcutOptions,
    callback: () => void,
    enabled: boolean = true
) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;

            const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
            // Only enforce modifier if explicitly set to true/false
            const matchesCtrl = typeof shortcut.ctrl === "boolean" 
                ? event.ctrlKey === shortcut.ctrl 
                : true;
            const matchesShift = typeof shortcut.shift === "boolean" 
                ? event.shiftKey === shortcut.shift 
                : true;
            const matchesAlt = typeof shortcut.alt === "boolean" 
                ? event.altKey === shortcut.alt 
                : true;
            const matchesMeta = typeof shortcut.meta === "boolean" 
                ? event.metaKey === shortcut.meta 
                : true;

            if (matchesKey && matchesCtrl && matchesShift && matchesAlt && matchesMeta) {
                if (shortcut.preventDefault !== false) {
                    event.preventDefault();
                }
                callback();
            }
        },
        [shortcut, callback, enabled]
    );

    useEffect(() => {
        if (typeof window === "undefined" || !enabled) return;

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown, enabled]);
}

// Common shortcuts
export function useCmdK(callback: () => void, enabled: boolean = true) {
    useKeyboardShortcut({ key: "k", meta: true }, callback, enabled);
}

export function useCmdS(callback: () => void, enabled: boolean = true) {
    useKeyboardShortcut({ key: "s", meta: true }, callback, enabled);
}

export function useEscape(callback: () => void, enabled: boolean = true) {
    useKeyboardShortcut({ key: "Escape" }, callback, enabled);
}
