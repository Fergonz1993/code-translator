// ===== CLASSNAME UTILITY =====
// Utility for merging Tailwind classes.

type ClassValue = string | undefined | null | false;

/**
 * Merge class names, filtering out falsy values.
 * Simple alternative to clsx/classnames.
 */
export function cn(...classes: ClassValue[]): string {
    return classes.filter(Boolean).join(" ");
}
