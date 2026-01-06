// ===== AVATAR COMPONENT =====
// User avatar with fallback initials.

interface AvatarProps {
    src?: string;
    alt?: string;
    name?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

const sizeStyles = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
};

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getColorFromName(name: string): string {
    const colors = [
        "bg-red-500",
        "bg-orange-500",
        "bg-amber-500",
        "bg-yellow-500",
        "bg-lime-500",
        "bg-green-500",
        "bg-emerald-500",
        "bg-teal-500",
        "bg-cyan-500",
        "bg-sky-500",
        "bg-blue-500",
        "bg-indigo-500",
        "bg-violet-500",
        "bg-purple-500",
        "bg-fuchsia-500",
        "bg-pink-500",
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ src, alt, name, size = "md", className = "" }: AvatarProps) {
    if (src) {
        return (
            <img
                src={src}
                alt={alt || name || "Avatar"}
                className={`
          rounded-full object-cover
          ${sizeStyles[size]}
          ${className}
        `}
            />
        );
    }

    const initials = name ? getInitials(name) : "?";
    const bgColor = name ? getColorFromName(name) : "bg-slate-500";

    return (
        <div
            className={`
        rounded-full flex items-center justify-center font-medium text-white
        ${bgColor}
        ${sizeStyles[size]}
        ${className}
      `}
            aria-label={name || "Avatar"}
        >
            {initials}
        </div>
    );
}
