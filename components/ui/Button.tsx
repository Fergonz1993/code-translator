// ===== BUTTON COMPONENT =====
// Reusable button with variants: primary, secondary, ghost, danger.

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

// ===== TYPES =====
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
}

// ===== STYLES =====
const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500",
    secondary: "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 focus:ring-slate-500",
    ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-500",
    danger: "bg-red-600 text-white hover:bg-red-500 focus:ring-red-500",
};

const sizeStyles: Record<ButtonSize, string> = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3",
};

// ===== COMPONENT =====
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = "primary", size = "md", isLoading, className, children, disabled, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <>
                        <svg 
                            className="animate-spin -ml-1 mr-2 h-4 w-4" 
                            viewBox="0 0 24 24" 
                            fill="none"
                            role="status"
                            aria-label="Loading"
                        >
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="sr-only">Loading…</span>
                    </>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

