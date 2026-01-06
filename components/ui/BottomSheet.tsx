// ===== BOTTOM SHEET COMPONENT =====
// Mobile-friendly slide-up panel.

"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
    // Close on escape key
    const handleEscape = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleEscape]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sheet */}
            <div
                className="
          absolute bottom-0 left-0 right-0
          bg-white dark:bg-slate-900
          rounded-t-2xl shadow-2xl
          border-t border-slate-200 dark:border-slate-700
          animate-in slide-in-from-bottom duration-300
          max-h-[85vh] flex flex-col
        "
                role="dialog"
                aria-modal="true"
            >
                {/* Handle */}
                <div className="flex justify-center pt-2 pb-2">
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                </div>

                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-200 dark:border-slate-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {children}
                </div>
            </div>
        </div>
    );
}
