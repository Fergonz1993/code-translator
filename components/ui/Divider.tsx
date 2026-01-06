// ===== DIVIDER COMPONENT =====
// Horizontal or vertical separator.

interface DividerProps {
    orientation?: "horizontal" | "vertical";
    className?: string;
    label?: string;
}

export function Divider({
    orientation = "horizontal",
    className = "",
    label,
}: DividerProps) {
    if (orientation === "vertical") {
        return (
            <div
                className={`w-px bg-slate-200 dark:bg-slate-700 ${className}`}
                role="separator"
                aria-orientation="vertical"
            />
        );
    }

    if (label) {
        return (
            <div className={`flex items-center ${className}`} role="separator">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="px-3 text-xs text-slate-500">{label}</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>
        );
    }

    return (
        <hr
            className={`border-0 h-px bg-slate-200 dark:bg-slate-700 ${className}`}
            role="separator"
        />
    );
}
