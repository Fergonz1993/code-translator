// ===== PROGRESS BAR COMPONENT =====
// Linear progress indicator.

interface ProgressProps {
    value: number; // 0-100
    max?: number;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "success" | "warning" | "error";
    showLabel?: boolean;
    className?: string;
}

const sizeStyles = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
};

const variantStyles = {
    default: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
};

export function Progress({
    value,
    max = 100,
    size = "md",
    variant = "default",
    showLabel = false,
    className = "",
}: ProgressProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className={className}>
            {showLabel && (
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(percentage)}%</span>
                </div>
            )}
            <div
                className={`
          w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden
          ${sizeStyles[size]}
        `}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
            >
                <div
                    className={`
            h-full rounded-full transition-all duration-300
            ${variantStyles[variant]}
          `}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}
