// ===== VALIDATION SCHEMAS =====
// Zod schemas for request validation across all API endpoints.

import { z } from "zod/v4";
import { AVAILABLE_MODELS, type AIModel } from "@/lib/types";

// ===== AI MODEL SCHEMA =====

// Ensure AVAILABLE_MODELS has at least one entry
if (AVAILABLE_MODELS.length === 0) {
    throw new Error("AVAILABLE_MODELS must contain at least one model");
}

const MODEL_IDS = AVAILABLE_MODELS.map((model) => model.id) as [
    AIModel,
    ...AIModel[],
];

export const aiModelSchema = z.enum(MODEL_IDS);

// ===== TRANSLATE REQUEST SCHEMA =====

export const translateRequestSchema = z.object({
    // The code to translate (required, max 50KB)
    code: z.string().min(1, "Code is required").max(50000, "Code too long (max 50KB)"),

    // Programming language name
    language: z.string().min(1, "Language is required").max(50, "Language name too long"),

    // AI model to use
    model: aiModelSchema,

    // Optional: User's own API key (BYOK mode)
    apiKey: z.string().optional(),

    // Optional: Specific line numbers to translate (1-based)
    lineNumbers: z
        .array(z.number().int().positive())
        .max(1000, "Too many line numbers")
        .optional(),

    // Optional: Idempotency key for credit consumption
    requestId: z.string().uuid().optional(),
});

export type ValidatedTranslateRequest = z.infer<typeof translateRequestSchema>;

// ===== CHECKOUT REQUEST SCHEMA =====

export const checkoutRequestSchema = z.object({
    packageId: z.enum(["credits_50", "credits_150", "credits_500"]),
});

export type ValidatedCheckoutRequest = z.infer<typeof checkoutRequestSchema>;

// ===== CLAIM REQUEST SCHEMA =====

export const claimRequestSchema = z.object({
    checkoutSessionId: z.string().min(1, "Checkout session ID is required"),
});

export type ValidatedClaimRequest = z.infer<typeof claimRequestSchema>;

// ===== HELPER: Parse and validate request body =====

export function parseRequest<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Format Zod errors into a readable message
    const errorMessages = result.error.issues
        .map((issue) => {
            const path = issue.path.length > 0 ? issue.path.join(".") : "root";
            return `${path}: ${issue.message}`;
        })
        .join("; ");

    return { success: false, error: errorMessages || "Invalid request" };
}
