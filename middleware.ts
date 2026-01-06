// ===== SECURITY HEADERS MIDDLEWARE =====
// Apply security headers to all responses.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://api.anthropic.com https://api.stripe.com",
        "frame-ancestors 'none'",
    ].join("; ");

    response.headers.set("Content-Security-Policy", csp);

    // XSS Protection
    response.headers.set("X-XSS-Protection", "1; mode=block");

    // Content Type Options
    response.headers.set("X-Content-Type-Options", "nosniff");

    // Frame Options
    response.headers.set("X-Frame-Options", "DENY");

    // Referrer Policy
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Permissions Policy
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    );

    return response;
}

export const config = {
    matcher: [
        // Skip internal Next.js paths and static files
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
