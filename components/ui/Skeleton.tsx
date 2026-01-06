// ===== SKELETON COMPONENT =====
// Loading placeholder with shimmer animation.

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular";
    width?: string | number;
    height?: string | number;
}

export function Skeleton({
    className = "",
    variant = "text",
    width,
    height,
}: SkeletonProps) {
    const variantStyles = {
        text: "rounded h-4",
        circular: "rounded-full",
        rectangular: "rounded-lg",
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === "number" ? `${width}px` : width;
    if (height) style.height = typeof height === "number" ? `${height}px` : height;

    return (
        <div
            className={`
        animate-pulse bg-slate-200 dark:bg-slate-700
        ${variantStyles[variant]}
        ${className}
      `}
            style={style}
            aria-hidden="true"
        />
    );
}

// Pre-built skeletons
export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    width={i === lines - 1 ? "75%" : "100%"}
                />
            ))}
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
            <Skeleton variant="rectangular" height={120} className="mb-4" />
            <Skeleton variant="text" width="60%" className="mb-2" />
            <Skeleton variant="text" width="80%" />
        </div>
    );
}
