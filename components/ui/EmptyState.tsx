// ===== EMPTY STATE COMPONENT =====
// Placeholder for empty lists/content areas.

import type { ReactNode } from "react";

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className = "",
}: EmptyStateProps) {
    return (
        <div
            className={`
        flex flex-col items-center justify-center text-center p-8
        ${className}
      `}
        >
            {icon && (
                <div className="mb-4 text-slate-400 dark:text-slate-500">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
                {title}
            </h3>
            {description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-sm">
                    {description}
                </p>
            )}
            {action}
        </div>
    );
}
