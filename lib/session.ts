// ===== SESSION UTILITIES =====
// Signed cookie-based session IDs to identify anonymous users server-side.

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

// ===== COOKIE CONFIG =====

const SESSION_COOKIE_NAME = "ct_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// ===== SECRET MANAGEMENT =====

function getSessionSecret(): string {
  const envSecret = process.env.SESSION_SECRET;

  if (process.env.NODE_ENV === "production") {
    if (!envSecret) {
      console.error("SESSION_SECRET is required in production.");
      process.exit(1);
    }
    return envSecret;
  }

  if (envSecret) return envSecret;

  console.warn("SESSION_SECRET not set. Using development-only fallback secret.");
  return "dev-only-session-secret-DO-NOT-USE-IN-PRODUCTION";
}

const EFFECTIVE_SESSION_SECRET = getSessionSecret();

// ===== SIGNING HELPERS =====

function signSessionId(sessionId: string): string {
  const signature = crypto
    .createHmac("sha256", EFFECTIVE_SESSION_SECRET)
    .update(sessionId)
    .digest("hex");

  return `${sessionId}.${signature}`;
}

function verifySessionCookie(value: string): string | null {
  const parts = value.split(".");
  if (parts.length !== 2) return null;

  const [sessionId, signature] = parts;
  const expected = crypto
    .createHmac("sha256", EFFECTIVE_SESSION_SECRET)
    .update(sessionId)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  return sessionId;
}

// ===== SESSION ACCESS =====

export function getSessionId(request: NextRequest): string | null {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  return verifySessionCookie(cookie);
}

export function ensureSessionId(request: NextRequest): {
  sessionId: string;
  isNew: boolean;
} {
  const existing = getSessionId(request);
  if (existing) return { sessionId: existing, isNew: false };

  return { sessionId: crypto.randomUUID(), isNew: true };
}

export function attachSessionCookie(
  response: NextResponse,
  sessionId: string
) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: signSessionId(sessionId),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}
