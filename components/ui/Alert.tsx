// ===== ALERT COMPONENT =====
// Contextual feedback messages.

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertProps {
    variant?: AlertVariant;
    title?: string;
    children: ReactNode;
    onDismiss?: () => void;
    className?: string;
}

const variantStyles: Record<AlertVariant, string> = {
    info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    success: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    warning: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
    error: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
};

const icons: Record<AlertVariant, ReactNode> = {
    info: <Info className="w-5 h-5" />,
    success: <CheckCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
};

export function Alert({
    variant = "info",
    title,
    children,
    onDismiss,
    className = "",
}: AlertProps) {
    return (
        <div
            className={`
        flex gap-3 p-4 rounded-lg border
        ${variantStyles[variant]}
        ${className}
      `}
            role="alert"
        >
            <div className="flex-shrink-0">{icons[variant]}</div>
            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className="font-medium mb-1">{title}</h4>
                )}
                <div className="text-sm opacity-90">{children}</div>
            </div>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
