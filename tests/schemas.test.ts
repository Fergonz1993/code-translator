import { describe, it, expect } from "vitest";
import {
    claimRequestSchema,
    checkoutRequestSchema,
    parseRequest,
    translateRequestSchema,
} from "@/lib/schemas";

describe("translateRequestSchema", () => {
    const validRequest = {
        code: "const x = 1;",
        language: "javascript",
        model: "gpt-4o-mini",
        requestId: "550e8400-e29b-41d4-a716-446655440000",
    };

    it("accepts a valid request", () => {
        const result = translateRequestSchema.safeParse(validRequest);
        expect(result.success).toBe(true);
    });

    it("requires code", () => {
        const result = translateRequestSchema.safeParse({ ...validRequest, code: "" });
        expect(result.success).toBe(false);
    });

    it("rejects code over 50KB", () => {
        const longCode = "a".repeat(50001);
        const result = translateRequestSchema.safeParse({ ...validRequest, code: longCode });
        expect(result.success).toBe(false);
    });

    it("rejects invalid model", () => {
        const result = translateRequestSchema.safeParse({ ...validRequest, model: "invalid-model" });
        expect(result.success).toBe(false);
    });

    it("rejects too-long apiKey", () => {
        const result = translateRequestSchema.safeParse({
            ...validRequest,
            apiKey: "a".repeat(201),
        });
        expect(result.success).toBe(false);
    });

    it("rejects invalid UUID for requestId", () => {
        const result = translateRequestSchema.safeParse({ ...validRequest, requestId: "not-a-uuid" });
        expect(result.success).toBe(false);
    });

    it("accepts optional lineNumbers", () => {
        const result = translateRequestSchema.safeParse({ 
            ...validRequest, 
            lineNumbers: [1, 2, 3] 
        });
        expect(result.success).toBe(true);
    });

    it("rejects negative lineNumbers", () => {
        const result = translateRequestSchema.safeParse({ 
            ...validRequest, 
            lineNumbers: [1, -1] 
        });
        expect(result.success).toBe(false);
    });

    it("rejects too many lineNumbers", () => {
        const result = translateRequestSchema.safeParse({ 
            ...validRequest, 
            lineNumbers: Array.from({ length: 1001 }, (_, i) => i + 1)
        });
        expect(result.success).toBe(false);
    });
});

describe("checkoutRequestSchema", () => {
    it("accepts valid packageId", () => {
        const result = checkoutRequestSchema.safeParse({ packageId: "credits_50" });
        expect(result.success).toBe(true);
    });

    it("rejects unknown packageId", () => {
        const result = checkoutRequestSchema.safeParse({ packageId: "credits_999" });
        expect(result.success).toBe(false);
    });
});

describe("claimRequestSchema", () => {
    it("requires checkoutSessionId", () => {
        const result = claimRequestSchema.safeParse({ checkoutSessionId: "" });
        expect(result.success).toBe(false);
    });

    it("accepts a non-empty checkoutSessionId", () => {
        const result = claimRequestSchema.safeParse({ checkoutSessionId: "cs_test_123" });
        expect(result.success).toBe(true);
    });
});

describe("parseRequest", () => {
    it("formats root-level validation errors", () => {
        const result = parseRequest(checkoutRequestSchema, null);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain("root:");
        }
    });

    it("falls back to a generic message when issues are empty", () => {
        const schema = {
            safeParse: () => ({ success: false, error: { issues: [] } }),
        } as any;

        const result = parseRequest(schema, {});
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe("Invalid request");
        }
    });
});
