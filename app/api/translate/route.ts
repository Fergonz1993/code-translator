// ===== API ROUTE: /api/translate =====
// Unified endpoint that handles translations from multiple AI providers.
//
// SUPPORTS:
// - OpenAI (GPT-4o Mini, GPT-4o)
// - Google (Gemini 2.0 Flash, Gemini 1.5 Flash)
// - Anthropic (Claude Haiku, Claude Sonnet)
//
// TWO MODES:
// 1. Credits mode: Uses our API keys (user pays with credits)
// 2. BYOK mode: Uses user's API key (passed in request)

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import {
  TranslateRequest,
  TranslatedLine,
  AIModel,
  AIProvider,
} from "@/lib/types";
import { attachSessionCookie, ensureSessionId } from "@/lib/session";
import { consumeCredits, getCreditsBalance, grantCredits } from "@/lib/credits-store";

// ===== CONSTANTS =====

const DEFAULT_RESPONSE_PLACEHOLDER = "(translation unavailable)";

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

const GENERIC_JSON_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      lineNumber: { type: "integer" },
      english: { type: "string" },
    },
    required: ["lineNumber", "english"],
  },
} as const;

// ===== HELPER: Get provider from model name =====
function getProviderForModel(model: AIModel): AIProvider {
  if (model.startsWith("gpt")) return "openai";
  if (model.startsWith("gemini")) return "google";
  return "anthropic";
}

// ===== HELPER: Get actual model ID for API calls =====
function getModelId(model: AIModel): string {
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

// ===== HELPER: Line helpers =====
function splitCodeLines(code: string): string[] {
  return code.split(/\r?\n/);
}

function normalizeLineNumbers(lineNumbers: number[] | undefined, totalLines: number): number[] {
  const fallback = Array.from({ length: totalLines }, (_, i) => i + 1);
  const raw = lineNumbers && lineNumbers.length > 0 ? lineNumbers : fallback;
  const normalized = raw
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.trunc(value))
    .filter((value) => value >= 1 && value <= totalLines);

  return Array.from(new Set(normalized)).sort((a, b) => a - b);
}

// ===== HELPER: Build prompt =====
function buildPrompt(options: {
  code: string;
  language: string;
  lineNumbers: number[];
  lines: string[];
  strict?: boolean;
}): string {
  const linesBlock = options.lineNumbers
    .map((lineNumber) => `${lineNumber}: ${options.lines[lineNumber - 1] ?? ""}`)
    .join("\n");

  return `You are a code-to-English translator. Translate the requested ${options.language} lines into plain English, line by line.

RULES:
- Return ONLY a valid JSON array, no markdown, no code fences
- Each object must include "lineNumber" and "english"
- Use the provided line numbers exactly
- Keep explanations SHORT (10-15 words max)
- Use simple, everyday language (like explaining to someone who doesn't code)
- For blank lines, return "---"
- For comments, say "Note: [what the comment says]"
- For closing braces/brackets alone, say "End of [what block it closes]"
- NO technical jargon
- Focus on WHAT it does, not HOW it works technically
${options.strict ? "- If you are unsure, still return a best-effort English explanation" : ""}

TRANSLATE ONLY THESE LINES:
${linesBlock}

FULL CODE (for context):
${options.code}
`;
}

// ===== HELPER: Parse and validate AI response =====
function extractJsonArray(content: string): string {
  const cleaned = content
    .replace(/^```(?:json)?\s*/gm, "")
    .replace(/```\s*$/gm, "")
    .trim();

  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.slice(start, end + 1);
  }

  return cleaned;
}

function parseTranslationResponse(
  content: string,
  expectedLineNumbers: number[],
  lines: string[]
): Map<number, string> {
  if (!content || content.trim() === "") {
    throw new Error("Empty response from AI provider");
  }

  const cleaned = extractJsonArray(content);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI response is not an array. Please try again.");
  }

  const remaining = new Set(expectedLineNumbers);
  const lineTextMap = new Map<string, number[]>();

  for (const lineNumber of expectedLineNumbers) {
    const lineText = lines[lineNumber - 1] ?? "";
    const list = lineTextMap.get(lineText);
    if (list) {
      list.push(lineNumber);
    } else {
      lineTextMap.set(lineText, [lineNumber]);
    }
  }

  const translations = new Map<number, string>();

  for (const item of parsed) {
    if (typeof item !== "object" || item === null) continue;

    const record = item as {
      lineNumber?: number | string;
      line?: string;
      english?: string;
    };

    if (typeof record.english !== "string") continue;

    let lineNumber: number | null = null;

    if (typeof record.lineNumber === "number" && Number.isFinite(record.lineNumber)) {
      lineNumber = Math.trunc(record.lineNumber);
    } else if (typeof record.lineNumber === "string") {
      const parsedNumber = Number(record.lineNumber);
      if (Number.isFinite(parsedNumber)) {
        lineNumber = Math.trunc(parsedNumber);
      }
    }

    if (lineNumber && remaining.has(lineNumber)) {
      translations.set(lineNumber, record.english);
      remaining.delete(lineNumber);
      continue;
    }

    if (!lineNumber && typeof record.line === "string") {
      const candidates = lineTextMap.get(record.line);
      if (candidates && candidates.length > 0) {
        const fallbackLineNumber = candidates.shift();
        if (fallbackLineNumber && remaining.has(fallbackLineNumber)) {
          translations.set(fallbackLineNumber, record.english);
          remaining.delete(fallbackLineNumber);
        }
      }
    }
  }

  return translations;
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
      responseSchema: GENERIC_JSON_SCHEMA,
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

  return message.content[0].type === "text" ? message.content[0].text : "";
}

async function requestTranslations(options: {
  code: string;
  language: string;
  lineNumbers: number[];
  lines: string[];
  model: AIModel;
  apiKey: string;
}): Promise<Map<number, string>> {
  const prompt = buildPrompt({
    code: options.code,
    language: options.language,
    lineNumbers: options.lineNumbers,
    lines: options.lines,
  });

  const provider = getProviderForModel(options.model);
  let content = "";

  switch (provider) {
    case "openai":
      content = await translateWithOpenAI(prompt, options.model, options.apiKey);
      break;
    case "google":
      content = await translateWithGemini(prompt, options.model, options.apiKey);
      break;
    case "anthropic":
      content = await translateWithClaude(prompt, options.model, options.apiKey);
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  return parseTranslationResponse(content, options.lineNumbers, options.lines);
}

async function translateLines(options: {
  code: string;
  language: string;
  lineNumbers: number[];
  lines: string[];
  model: AIModel;
  apiKey: string;
}): Promise<Map<number, string>> {
  const initial = await requestTranslations(options);
  const missing = options.lineNumbers.filter((lineNumber) => !initial.has(lineNumber));

  if (missing.length === 0) return initial;

  const retryPrompt = buildPrompt({
    code: options.code,
    language: options.language,
    lineNumbers: missing,
    lines: options.lines,
    strict: true,
  });

  const provider = getProviderForModel(options.model);
  let retryContent = "";

  switch (provider) {
    case "openai":
      retryContent = await translateWithOpenAI(retryPrompt, options.model, options.apiKey);
      break;
    case "google":
      retryContent = await translateWithGemini(retryPrompt, options.model, options.apiKey);
      break;
    case "anthropic":
      retryContent = await translateWithClaude(retryPrompt, options.model, options.apiKey);
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  const retryTranslations = parseTranslationResponse(retryContent, missing, options.lines);
  for (const [lineNumber, english] of retryTranslations.entries()) {
    initial.set(lineNumber, english);
  }

  return initial;
}

// ===== MAIN HANDLER =====
export async function POST(request: NextRequest) {
  try {
    // ===== STEP 1: Parse the request =====
    const body = (await request.json()) as TranslateRequest;

    // ===== STEP 2: Validate required fields =====
    if (!body.code || !body.language || !body.model) {
      return NextResponse.json(
        { error: "Missing required fields: code, language, or model" },
        { status: 400 }
      );
    }

    // ===== STEP 3: Prepare session and lines =====
    const { sessionId, isNew } = ensureSessionId(request);
    const lines = splitCodeLines(body.code);
    const requestedLineNumbers = normalizeLineNumbers(body.lineNumbers, lines.length);

    if (requestedLineNumbers.length === 0) {
      return NextResponse.json(
        { error: "No valid line numbers provided" },
        { status: 400 }
      );
    }

    const blankLineNumbers = requestedLineNumbers.filter(
      (lineNumber) => (lines[lineNumber - 1] ?? "").trim() === ""
    );
    const blankLineSet = new Set(blankLineNumbers);
    const translateLineNumbers = requestedLineNumbers.filter(
      (lineNumber) => !blankLineSet.has(lineNumber)
    );

    // ===== STEP 4: Determine which API key to use =====
    const provider = getProviderForModel(body.model);
    let apiKey: string | undefined;

    if (body.apiKey) {
      apiKey = body.apiKey;
    } else {
      const envKeyMap: Record<AIProvider, string | undefined> = {
        openai: process.env.OPENAI_API_KEY,
        google: process.env.GOOGLE_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
      };
      apiKey = envKeyMap[provider];
    }

    if (!apiKey) {
      const message = body.apiKey
        ? "Invalid API key provided"
        : `No API key configured for ${provider}. Please add your own API key in Settings.`;

      return NextResponse.json({ error: message }, { status: 400 });
    }

    // ===== STEP 5: Handle blank-only requests =====
    const translations: TranslatedLine[] = requestedLineNumbers.map((lineNumber) => ({
      lineNumber,
      line: lines[lineNumber - 1] ?? "",
      english: blankLineSet.has(lineNumber) ? "---" : "",
    }));

    if (translateLineNumbers.length === 0) {
      const response = NextResponse.json({
        translations,
        model: body.model,
        credits: body.apiKey ? undefined : getCreditsBalance(sessionId),
      });

      if (isNew) {
        attachSessionCookie(response, sessionId);
      }

      return response;
    }

    // ===== STEP 6: Credits check (only for credits mode) =====
    const isCreditsMode = !body.apiKey;
    const requestId = body.requestId || crypto.randomUUID();
    let creditsBalance = isCreditsMode ? getCreditsBalance(sessionId) : undefined;
    let creditsCharged = false;

    if (isCreditsMode) {
      if ((creditsBalance?.remaining ?? 0) <= 0) {
        return NextResponse.json(
          { error: "You are out of credits. Buy more or add your own API key in Settings." },
          { status: 402 }
        );
      }

      const consumption = consumeCredits({
        sessionId,
        amount: 1,
        source: "translation",
        idempotencyKey: `translate:${requestId}`,
      });

      if (!consumption.ok) {
        return NextResponse.json(
          { error: "You are out of credits. Buy more or add your own API key in Settings." },
          { status: 402 }
        );
      }

      creditsCharged = consumption.charged;
      creditsBalance = consumption.balance;
    }

    try {
      // ===== STEP 7: Translate missing lines =====
      const translatedMap = await translateLines({
        code: body.code,
        language: body.language,
        lineNumbers: translateLineNumbers,
        lines,
        model: body.model,
        apiKey,
      });

      for (const entry of translations) {
        if (entry.english) continue;
        const english = translatedMap.get(entry.lineNumber);
        entry.english = english ?? DEFAULT_RESPONSE_PLACEHOLDER;
      }

      const response = NextResponse.json({
        translations,
        model: body.model,
        credits: creditsBalance,
      });

      if (isNew) {
        attachSessionCookie(response, sessionId);
      }

      return response;
    } catch (error) {
      // Refund on failure if we charged credits
      if (creditsCharged) {
        grantCredits({
          sessionId,
          amount: 1,
          source: "translation_refund",
          idempotencyKey: `refund:${requestId}`,
        });
      }

      throw error;
    }
  } catch (error) {
    console.error("Translation error:", error);

    let errorMessage = "Translation failed";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes("401") || error.message.includes("API key")) {
        errorMessage = "Invalid API key. Please check your API key in Settings.";
        statusCode = 401;
      } else if (error.message.includes("429") || error.message.includes("rate")) {
        errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
        statusCode = 429;
      } else if (error.message.includes("insufficient_quota")) {
        errorMessage = "API quota exceeded. Please check your billing.";
        statusCode = 402;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
