// ===== SECURITY HEADERS PROXY (PREVIOUSLY MIDDLEWARE) =====
// Apply security headers to all responses with CSP nonce support.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Generate a random nonce for this request
function generateNonce(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    let binary = "";
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

export function proxy(request: NextRequest) {
    // Generate nonce for this request
    const nonce = generateNonce();

    // Content Security Policy with nonce
    const csp = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
        "img-src 'self' data: blob: https:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://api.anthropic.com https://api.stripe.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join("; ");

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    // Next.js reads the CSP from the request headers to attach the nonce.
    requestHeaders.set("content-security-policy", csp);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // Store nonce in header for use by components
    response.headers.set("x-nonce", nonce);
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
