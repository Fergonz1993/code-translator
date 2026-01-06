// ===== TOOLTIP COMPONENT =====
// Hover tooltip for additional information.

"use client";

import { useState, type ReactNode } from "react";

interface TooltipProps {
    content: string;
    children: ReactNode;
    position?: "top" | "bottom" | "left" | "right";
}

const positionStyles = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

export function Tooltip({ content, children, position = "top" }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    className={`
            absolute z-50 px-2 py-1
            bg-slate-900 dark:bg-slate-700 text-white text-xs
            rounded shadow-lg whitespace-nowrap
            animate-in fade-in duration-150
            ${positionStyles[position]}
          `}
                    role="tooltip"
                >
                    {content}
                </div>
            )}
        </div>
    );
}
