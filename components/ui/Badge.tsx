// ===== BADGE COMPONENT =====
// Status indicator badges with color variants.

import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps {
    variant?: BadgeVariant;
    children: ReactNode;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    success: "bg-green-500/20 text-green-600 dark:text-green-400",
    warning: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    error: "bg-red-500/20 text-red-600 dark:text-red-400",
    info: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
    return (
        <span
            className={`
        inline-flex items-center px-2 py-1 text-xs font-medium rounded-md
        ${variantStyles[variant]}
        ${className}
      `}
        >
            {children}
        </span>
    );
}
