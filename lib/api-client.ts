// ===== API CLIENT =====
// Typed fetch wrapper for API calls.

import { API_ENDPOINTS, REQUEST_TIMEOUT_MS } from "./constants";

// ===== TYPES =====
interface ApiError {
    error: string;
    code?: string;
    retryAfter?: number;
}

interface ApiResponse<T> {
    data: T | null;
    error: ApiError | null;
    status: number;
}

// ===== HELPERS =====
async function fetchWithTimeout<T>(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Try to parse JSON, handle parse failures
        let parsedData;
        try {
            parsedData = await response.json();
        } catch {
            const rawText = await response.text().catch(() => "");
            return {
                data: null,
                error: { error: rawText || "Invalid JSON response" },
                status: response.status,
            };
        }

        if (!response.ok) {
            return {
                data: null,
                error: {
                    error: parsedData.error || "Request failed",
                    code: parsedData.code,
                    retryAfter: parsedData.retryAfter,
                },
                status: response.status,
            };
        }

        return {
            data: parsedData,
            error: null,
            status: response.status,
        };
    } catch (err) {
        clearTimeout(timeoutId);

        if (err instanceof Error && err.name === "AbortError") {
            return {
                data: null,
                error: { error: "Request timed out" },
                status: 408,
            };
        }

        return {
            data: null,
            error: { error: err instanceof Error ? err.message : "Network error" },
            status: 0,
        };
    }
}

// ===== API METHODS =====
export const apiClient = {
    // Translate code
    async translate(body: {
        code: string;
        language: string;
        model: string;
        lineNumbers: number[];
        requestId: string;
        apiKey?: string;
    }) {
        return fetchWithTimeout<{
            translations: Array<{ lineNumber: number; line: string; english: string }>;
            model: string;
            credits?: { total: number; used: number; remaining: number };
            cached?: boolean;
        }>(API_ENDPOINTS.translate, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    },

    // Create checkout session
    async checkout(packageId: string) {
        return fetchWithTimeout<{ url: string; sessionId: string }>(
            API_ENDPOINTS.checkout,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packageId }),
            }
        );
    },

    // Get credits balance
    async getCreditsBalance() {
        return fetchWithTimeout<{
            credits: { total: number; used: number; remaining: number };
        }>(API_ENDPOINTS.creditsBalance);
    },

    // Claim credits after purchase
    async claimCredits(sessionId: string) {
        return fetchWithTimeout<{
            status: string;
            creditsAdded?: number;
            balance?: { total: number; used: number; remaining: number };
            error?: string;
        }>(`${API_ENDPOINTS.creditsClaim}?session_id=${sessionId}`);
    },
};
