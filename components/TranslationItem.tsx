// ===== TRANSLATION LIST ITEM =====
// Memoized translation line component for performance.

import { memo } from "react";
import type { TranslatedLine } from "@/lib/types";

interface TranslationItemProps {
    item: TranslatedLine;
    isHovered: boolean;
    onHover: (lineNumber: number | null) => void;
}

export const TranslationItem = memo(function TranslationItem({
    item,
    isHovered,
    onHover,
}: TranslationItemProps) {
    return (
        <div
            className={`
        flex gap-4 p-3 rounded-lg transition-colors cursor-pointer
        ${isHovered
                    ? "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-blue-500"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-2 border-transparent"
                }
      `}
            onMouseEnter={() => onHover(item.lineNumber)}
            onMouseLeave={() => onHover(null)}
        >
            {/* Line number */}
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-8 flex-shrink-0 text-right pt-0.5">
                {item.lineNumber}
            </span>

            {/* Translation content */}
            <div className="flex-1 min-w-0">
                {/* Original code line */}
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate mb-1">
                    {item.line || "---"}
                </div>

                {/* English translation */}
                <div className="text-sm text-slate-900 dark:text-white">
                    {item.english}
                </div>
            </div>
        </div>
    );
});
