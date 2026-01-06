// ===== USE MEDIA QUERY HOOK =====
// Responsive breakpoint detection.

"use client";

import { useState, useEffect } from "react";
import { BREAKPOINTS } from "@/lib/constants";

type Breakpoint = keyof typeof BREAKPOINTS;

export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(() => {
        // Initialize with actual value on client, false on server
        if (typeof window !== "undefined") {
            return window.matchMedia(query).matches;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, [query]);

    return matches;
}

// Convenience hooks for common breakpoints
export function useIsMobile(): boolean {
    return !useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
}

export function useIsTablet(): boolean {
    const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
    const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
    return isMd && !isLg;
}

export function useIsDesktop(): boolean {
    return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

export function useBreakpoint(): Breakpoint | "xs" {
    const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px)`);
    const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
    const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
    const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);
    const is2xl = useMediaQuery(`(min-width: ${BREAKPOINTS["2xl"]}px)`);

    if (is2xl) return "2xl";
    if (isXl) return "xl";
    if (isLg) return "lg";
    if (isMd) return "md";
    if (isSm) return "sm";
    return "xs";
}
