// ===== HEALTH CHECK ENDPOINT =====
// Returns server health status for monitoring.

export const runtime = "nodejs";

import { NextResponse } from "next/server";

interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        database: boolean;
        stripe: boolean;
        aiProviders: {
            openai: boolean;
            google: boolean;
            anthropic: boolean;
        };
    };
}

const startTime = Date.now();

export async function GET() {
    const checks = {
        database: await checkDatabase(),
        stripe: checkStripe(),
        aiProviders: {
            openai: !!process.env.OPENAI_API_KEY,
            google: !!process.env.GOOGLE_API_KEY,
            anthropic: !!process.env.ANTHROPIC_API_KEY,
        },
    };

    const allHealthy = checks.database && checks.stripe &&
        Object.values(checks.aiProviders).some(Boolean);

    const status: HealthStatus = {
        status: allHealthy ? "healthy" : checks.database ? "degraded" : "unhealthy",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        uptime: Math.floor((Date.now() - startTime) / 1000),
        checks,
    };

    return NextResponse.json(status, {
        status: status.status === "unhealthy" ? 503 : 200,
    });
}

async function checkDatabase(): Promise<boolean> {
    try {
        // Try to import and use credits store
        const { getCreditsBalance } = await import("@/lib/credits-store");
        await getCreditsBalance("health-check-probe");
        return true;
    } catch {
        return false;
    }
}

function checkStripe(): boolean {
    return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET;
}
