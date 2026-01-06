// ===== CUSTOM ERROR CLASSES =====
// Typed errors for better error handling and client feedback.

// ===== BASE ERROR =====

export class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly retryable: boolean;

    constructor(options: {
        message: string;
        code: string;
        statusCode?: number;
        retryable?: boolean;
    }) {
        super(options.message);
        this.name = this.constructor.name;
        this.code = options.code;
        this.statusCode = options.statusCode ?? 500;
        this.retryable = options.retryable ?? false;
    }
}

// ===== VALIDATION ERRORS =====

export class ValidationError extends AppError {
    constructor(message: string) {
        super({
            message,
            code: "VALIDATION_ERROR",
            statusCode: 400,
            retryable: false,
        });
    }
}

// ===== CREDITS ERRORS =====

export class InsufficientCreditsError extends AppError {
    constructor() {
        super({
            message: "You are out of credits. Buy more or add your own API key in Settings.",
            code: "INSUFFICIENT_CREDITS",
            statusCode: 402,
            retryable: false,
        });
    }
}

// ===== AI PROVIDER ERRORS =====

export class AIProviderError extends AppError {
    readonly provider?: string;

    constructor(options: {
        message: string;
        provider?: string;
        retryable?: boolean;
    }) {
        super({
            message: options.message,
            code: "AI_PROVIDER_ERROR",
            statusCode: 502,
            retryable: options.retryable ?? true,
        });
        this.provider = options.provider;
    }
}

export class RateLimitError extends AppError {
    constructor() {
        super({
            message: "Rate limit exceeded. Please wait a moment and try again.",
            code: "RATE_LIMIT_EXCEEDED",
            statusCode: 429,
            retryable: true,
        });
    }
}

export class InvalidAPIKeyError extends AppError {
    constructor() {
        super({
            message: "Invalid API key. Please check your API key in Settings.",
            code: "INVALID_API_KEY",
            statusCode: 401,
            retryable: false,
        });
    }
}

export class QuotaExceededError extends AppError {
    constructor() {
        super({
            message: "API quota exceeded. Please check your billing.",
            code: "QUOTA_EXCEEDED",
            statusCode: 402,
            retryable: false,
        });
    }
}

// ===== STRIPE ERRORS =====

export class StripeNotConfiguredError extends AppError {
    constructor() {
        super({
            message: "Payment system not configured. Please use your own API key instead.",
            code: "STRIPE_NOT_CONFIGURED",
            statusCode: 503,
            retryable: false,
        });
    }
}

// ===== HELPER: Convert unknown error to AppError =====

export function toAppError(error: unknown): AppError {
    if (error instanceof AppError) {
        return error;
    }

    if (error instanceof Error) {
        // Check for common AI provider error patterns case-insensitively
        const msg = error.message.toLowerCase();

        if (msg.includes("401") || msg.includes("api key") || msg.includes("unauthorized")) {
            return new InvalidAPIKeyError();
        }

        if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many requests")) {
            return new RateLimitError();
        }

        if (msg.includes("insufficient_quota") || msg.includes("quota exceeded") || msg.includes("billing")) {
            return new QuotaExceededError();
        }

        return new AppError({
            message: error.message,
            code: "UNKNOWN_ERROR",
            statusCode: 500,
            retryable: false,
        });
    }

    return new AppError({
        message: "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
        statusCode: 500,
        retryable: false,
    });
}
