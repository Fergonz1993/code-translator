// ===== AI TRANSLATOR SERVICE =====
// Handles all AI provider interactions for code translation.
// Supports OpenAI, Google Gemini, and Anthropic Claude.

import OpenAI from "openai";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import {
  getProviderForModel as getProviderForModelFromTypes,
  type AIModel,
  type AIProvider,
} from "@/lib/types";
import { REQUEST_TIMEOUT_MS } from "@/lib/constants";
import { isRetryableError, withRetry } from "@/lib/services/retry";

// ===== TYPES =====

export interface TranslationResult {
    lineNumber: number;
    english: string;
}

// ===== JSON SCHEMAS =====

const OPENAI_JSON_SCHEMA = {
    name: "translations",
    schema: {
        type: "array",
        items: {
            type: "object",
            properties: {
                lineNumber: { type: "integer" },
                english: { type: "string" },
            },
            required: ["lineNumber", "english"],
            additionalProperties: false,
        },
    },
} as const;

const GEMINI_JSON_SCHEMA: Schema = {
    type: SchemaType.ARRAY,
    items: {
        type: SchemaType.OBJECT,
        properties: {
            lineNumber: { type: SchemaType.INTEGER },
            english: { type: SchemaType.STRING },
        },
        required: ["lineNumber", "english"],
    },
};

// ===== HELPERS =====

export function getProviderForModel(model: AIModel): AIProvider {
    return getProviderForModelFromTypes(model);
}

export function getModelId(model: AIModel): string {
    const modelMap: Record<AIModel, string> = {
        "gpt-4o-mini": "gpt-4o-mini",
        "gpt-4o": "gpt-4o",
        "gemini-2.0-flash": "gemini-2.0-flash",
        "gemini-1.5-flash": "gemini-1.5-flash",
        "claude-haiku": "claude-3-5-haiku-latest",
        "claude-sonnet": "claude-sonnet-4-20250514",
    };
    return modelMap[model] || model;
}

function isSuspiciousApiKey(provider: AIProvider, apiKey: string): boolean {
    const trimmed = apiKey.trim();
    if (trimmed !== apiKey) return true;
    if (apiKey.length < 20 || apiKey.length > 200) return true;
    if (/\s/.test(apiKey)) return true;

    const allowedPrefixes: Record<AIProvider, string[]> = {
        openai: ["sk-"],
        anthropic: ["sk-ant-"],
        google: ["AI", "AIza"],
    };

    return !allowedPrefixes[provider].some((prefix) => apiKey.startsWith(prefix));
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error("AI request timed out."));
        }, timeoutMs);

        promise
            .then((result) => {
                clearTimeout(timeoutId);
                resolve(result);
            })
            .catch((error) => {
                clearTimeout(timeoutId);
                reject(error);
            });
    });
}

// ===== PROVIDER CALLS =====

async function translateWithOpenAI(
    prompt: string,
    model: AIModel,
    apiKey: string
): Promise<string> {
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
        model: getModelId(model),
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_schema", json_schema: OPENAI_JSON_SCHEMA },
    });

    return response.choices[0]?.message?.content || "";
}

async function translateWithGemini(
    prompt: string,
    model: AIModel,
    apiKey: string
): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
        model: getModelId(model),
        generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: GEMINI_JSON_SCHEMA,
        },
    });

    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
}

async function translateWithClaude(
    prompt: string,
    model: AIModel,
    apiKey: string
): Promise<string> {
    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
        model: getModelId(model),
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
    });

    const textBlocks = message.content.filter(block => block.type === "text");
    return textBlocks.map(block => block.text).join("\n");
}

// ===== MAIN TRANSLATION FUNCTION =====

export async function callAIProvider(options: {
    prompt: string;
    model: AIModel;
    apiKey: string;
}): Promise<string> {
    const provider = getProviderForModel(options.model);
    const timeoutMs = Number(process.env.AI_TIMEOUT_MS || REQUEST_TIMEOUT_MS);
    const retryOptions = {
        retries: Number(process.env.AI_RETRY_ATTEMPTS || 2),
        baseDelayMs: Number(process.env.AI_RETRY_BASE_MS || 250),
        maxDelayMs: Number(process.env.AI_RETRY_MAX_MS || 2000),
        shouldRetry: isRetryableError,
    };

    switch (provider) {
        case "openai":
            return withRetry(
                () => withTimeout(
                    translateWithOpenAI(options.prompt, options.model, options.apiKey),
                    timeoutMs
                ),
                retryOptions
            );
        case "google":
            return withRetry(
                () => withTimeout(
                    translateWithGemini(options.prompt, options.model, options.apiKey),
                    timeoutMs
                ),
                retryOptions
            );
        case "anthropic":
            return withRetry(
                () => withTimeout(
                    translateWithClaude(options.prompt, options.model, options.apiKey),
                    timeoutMs
                ),
                retryOptions
            );
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

// ===== API KEY RESOLUTION =====

export function resolveApiKey(
    model: AIModel,
    userApiKey?: string
): { apiKey: string; isUserKey: boolean } | null {
    const provider = getProviderForModel(model);

    if (userApiKey) {
        if (isSuspiciousApiKey(provider, userApiKey)) {
            throw new Error("Invalid API key format.");
        }
        return { apiKey: userApiKey, isUserKey: true };
    }

    const envKeyMap: Record<AIProvider, string | undefined> = {
        openai: process.env.OPENAI_API_KEY,
        google: process.env.GOOGLE_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
    };

    const envKey = envKeyMap[provider];
    if (envKey) {
        return { apiKey: envKey, isUserKey: false };
    }

    return null;
}
