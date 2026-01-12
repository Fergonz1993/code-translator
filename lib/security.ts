// ===== SECURITY UTILITIES =====
// Helpers for Origin validation, APP_URL handling, and security middleware.

import { NextRequest, NextResponse } from "next/server";

// ===== APP URL =====

/**
 * Get the trusted application URL from environment.
 * Falls back to localhost in development only.
 */
export function getAppUrl(): string | null {
    const appUrl = process.env.APP_URL;

    if (appUrl) return appUrl;

    if (process.env.NODE_ENV !== "production") {
        return "http://localhost:3000";
    }

    return null;
}

// ===== ORIGIN VALIDATION =====

/**
 * Validate that a request comes from an allowed origin.
 * Used to protect credit-consuming endpoints from cross-origin abuse.
 */
export function validateOrigin(request: NextRequest): {
    valid: boolean;
    origin: string | null;
    error?: string;
} {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");

    // Allow requests without origin (same-origin, curl, etc.) in development
    if (!origin && process.env.NODE_ENV !== "production") {
        return { valid: true, origin: null };
    }

    const appUrl = getAppUrl();

    // In production, APP_URL must be set
    if (!appUrl) {
        return {
            valid: false,
            origin,
            error: "Server configuration error: APP_URL not set"
        };
    }

    const allowedOrigins = getAllowedOrigins(appUrl);

    // Check origin header
    if (origin && allowedOrigins.includes(origin)) {
        return { valid: true, origin };
    }

    // Check referer as fallback (for same-origin requests)
    if (referer) {
        try {
            const refererOrigin = new URL(referer).origin;
            if (allowedOrigins.includes(refererOrigin)) {
                return { valid: true, origin: refererOrigin };
            }
        } catch {
            // Invalid referer URL, continue to reject
        }
    }

    return {
        valid: false,
        origin,
        error: `Origin '${origin}' not allowed`
    };
}

/**
 * Get list of allowed origins based on APP_URL.
 * Includes common development variants.
 */
function getAllowedOrigins(appUrl: string): string[] {
    const origins = [appUrl];

    // In development, allow localhost variants
    if (process.env.NODE_ENV !== "production") {
        origins.push(
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://[::1]:3000"
        );
    }

    // Allow additional origins from env (comma-separated)
    const additional = process.env.ALLOWED_ORIGINS;
    if (additional) {
        origins.push(...additional.split(",").map(o => o.trim()));
    }

    return origins;
}

// ===== MIDDLEWARE HELPERS =====

/**
 * Create a 403 response for origin validation failures.
 */
export function createOriginErrorResponse(error: string): NextResponse {
    return NextResponse.json(
        { error: "Request blocked by security policy" },
        {
            status: 403,
            headers: { "X-Security-Error": error }
        }
    );
}
