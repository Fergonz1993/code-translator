// ===== CARD COMPONENT =====
// Container component with consistent styling.

import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
    none: "",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
};

export function Card({ children, padding = "md", className = "", ...props }: CardProps) {
    return (
        <div
            className={`
        bg-white dark:bg-slate-900
        border border-slate-200 dark:border-slate-700
        rounded-xl shadow-sm
        ${paddingStyles[padding]}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
}

// Card Header
export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <div className={`mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 ${className}`}>
            {children}
        </div>
    );
}

// Card Title
export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <h3 className={`text-lg font-semibold text-slate-900 dark:text-white ${className}`}>
            {children}
        </h3>
    );
}

// Card Content
export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
    return <div className={className}>{children}</div>;
}
