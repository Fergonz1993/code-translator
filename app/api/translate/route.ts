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

export const runtime = "nodejs";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { AIModel, AIProvider, TranslatedLine } from "@/lib/types";
import { translateRequestSchema, parseRequest } from "@/lib/schemas";
import { jsonError } from "@/lib/api-errors";
import { attachSessionCookie, ensureSessionId } from "@/lib/session";
import { consumeCredits, getCreditsBalance, grantCredits } from "@/lib/credits-store";
import { checkRateLimit } from "@/lib/rate-limiter";
import { validateOrigin } from "@/lib/security";
import { toAppError } from "@/lib/errors";

// ===== SERVICES =====
import { callAIProvider, resolveApiKey, getProviderForModel } from "@/lib/services/ai-translator";
import { buildTranslationPrompt, splitCodeLines, normalizeLineNumbers, identifyBlankLines } from "@/lib/services/prompt-builder";
import { parseTranslationResponse, DEFAULT_PLACEHOLDER } from "@/lib/services/response-parser";
import { getCachedTranslation, setCachedTranslation } from "@/lib/services/translation-cache";
import { logTranslateEvent } from "@/lib/translate-logger";
import { logCreditsEvent } from "@/lib/credits-logger";

// ===== TRANSLATION WITH RETRY =====

async function translateLines(options: {
  code: string;
  language: string;
  lineNumbers: number[];
  lines: string[];
  model: Parameters<typeof callAIProvider>[0]["model"];
  apiKey: string;
}): Promise<Map<number, string>> {
  // First attempt
  const prompt = buildTranslationPrompt({
    code: options.code,
    language: options.language,
    lineNumbers: options.lineNumbers,
    lines: options.lines,
  });

  const response = await callAIProvider({
    prompt,
    model: options.model,
    apiKey: options.apiKey,
  });

  const initial = parseTranslationResponse(response, options.lineNumbers, options.lines);
  const missing = options.lineNumbers.filter((lineNumber) => !initial.has(lineNumber));

  if (missing.length === 0) return initial;

  // Retry for missing lines
  const retryPrompt = buildTranslationPrompt({
    code: options.code,
    language: options.language,
    lineNumbers: missing,
    lines: options.lines,
    strict: true,
  });

  const retryResponse = await callAIProvider({
    prompt: retryPrompt,
    model: options.model,
    apiKey: options.apiKey,
  });

  const retryTranslations = parseTranslationResponse(retryResponse, missing, options.lines);
  for (const [lineNumber, english] of retryTranslations.entries()) {
    initial.set(lineNumber, english);
  }

  return initial;
}

// ===== MAIN HANDLER =====

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let requestId: string = crypto.randomUUID();
  let modelForLog: AIModel | null = null;
  let providerForLog: AIProvider | null = null;

  try {
    // ===== STEP 1: Parse and validate the request =====
    const rawBody = await request.json();
    const parsed = parseRequest(translateRequestSchema, rawBody);

    if (!parsed.success) {
      return jsonError({ error: parsed.error, status: 400, requestId });
    }

    const body = parsed.data;
    requestId = body.requestId || requestId;
    modelForLog = body.model;
    const provider = getProviderForModel(body.model);
    providerForLog = provider;

    const originCheck = validateOrigin(request);
    if (!originCheck.valid) {
      return jsonError({
        error: originCheck.error || "Request blocked by security policy.",
        status: 403,
        requestId,
      });
    }

    // ===== STEP 2: Prepare session =====
    const { sessionId, isNew } = ensureSessionId(request);

    // ===== STEP 3: Check rate limit =====
    const rateLimitMode = body.apiKey ? "byok" : "credits";
    const rateLimit = checkRateLimit(sessionId, rateLimitMode);

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.retryAfterMs ?? 1000) / 1000);
      const response = jsonError({
        error: "Rate limit exceeded. Please wait a moment and try again.",
        status: 429,
        requestId,
        extra: { retryAfter },
      });
      response.headers.set("Retry-After", String(retryAfter));
      return response;
    }

    // ===== STEP 4: Prepare lines =====
    const lines = splitCodeLines(body.code);
    const requestedLineNumbers = normalizeLineNumbers(body.lineNumbers, lines.length);

    if (requestedLineNumbers.length === 0) {
      return jsonError({ error: "No valid line numbers provided", status: 400, requestId });
    }

    const { blankLines, nonBlankLines } = identifyBlankLines(lines, requestedLineNumbers);

    // ===== STEP 5: Resolve API key =====
    const keyResult = resolveApiKey(body.model, body.apiKey);

    if (!keyResult) {
      const provider = getProviderForModel(body.model);
      return jsonError({
        error: `No API key configured for ${provider}. Please add your own API key in Settings.`,
        status: 400,
        requestId,
      });
    }

    // ===== STEP 6: Prepare response array =====
    const translations: TranslatedLine[] = requestedLineNumbers.map((lineNumber) => ({
      lineNumber,
      line: lines[lineNumber - 1] ?? "",
      english: blankLines.has(lineNumber) ? "---" : "",
    }));

    // ===== STEP 7: Handle blank-only requests =====
    if (nonBlankLines.length === 0) {
      const response = NextResponse.json({
        translations,
        model: body.model,
        credits: keyResult.isUserKey ? undefined : getCreditsBalance(sessionId),
        requestId,
      });

      if (isNew) attachSessionCookie(response, sessionId);
      return response;
    }

    // ===== STEP 8: Check cache (before consuming credits) =====
    const cachedResult = getCachedTranslation({
      code: body.code,
      language: body.language,
      model: body.model,
    });

    if (cachedResult) {
      // Cache hit! Return cached translations without consuming credits
      for (const cached of cachedResult.translations) {
        const entry = translations.find((t) => t.lineNumber === cached.lineNumber);
        if (entry && !blankLines.has(cached.lineNumber)) {
          entry.english = cached.english;
        }
      }

      const response = NextResponse.json({
        translations,
        model: body.model,
        credits: keyResult.isUserKey ? undefined : getCreditsBalance(sessionId),
        cached: true, // Signal to frontend that this was cached
        requestId,
      });

      logTranslateEvent({
        event: "translate",
        status: "success",
        requestId,
        model: body.model,
        provider,
        latencyMs: Date.now() - startTime,
        cached: true,
      });

      if (isNew) attachSessionCookie(response, sessionId);
      return response;
    }

    // ===== STEP 9: Credits check (only for credits mode) =====
    const isCreditsMode = !keyResult.isUserKey;
    let creditsBalance = isCreditsMode ? getCreditsBalance(sessionId) : undefined;
    let creditsCharged = false;

    if (isCreditsMode) {
      if ((creditsBalance?.remaining ?? 0) <= 0) {
        return jsonError({
          error: "You are out of credits. Buy more or add your own API key in Settings.",
          status: 402,
          requestId,
        });
      }

      const consumption = consumeCredits({
        sessionId,
        amount: 1,
        source: "translation",
        idempotencyKey: `translate:${requestId}`,
      });

      if (!consumption.ok) {
        return jsonError({
          error: "You are out of credits. Buy more or add your own API key in Settings.",
          status: 402,
          requestId,
        });
      }

      creditsCharged = consumption.charged;
      creditsBalance = consumption.balance;

      if (consumption.charged) {
        logCreditsEvent({
          event: "credits",
          action: "consume",
          requestId,
          amount: 1,
          source: "translation",
          remaining: consumption.balance.remaining,
        });
      }
    }

    try {
      // ===== STEP 10: Translate lines =====
      const translatedMap = await translateLines({
        code: body.code,
        language: body.language,
        lineNumbers: nonBlankLines,
        lines,
        model: body.model,
        apiKey: keyResult.apiKey,
      });

      for (const entry of translations) {
        if (entry.english) continue;
        const english = translatedMap.get(entry.lineNumber);
        entry.english = english ?? DEFAULT_PLACEHOLDER;
      }

      // ===== STEP 11: Save to cache =====
      setCachedTranslation({
        code: body.code,
        language: body.language,
        model: body.model,
        translations,
      });

      const response = NextResponse.json({
        translations,
        model: body.model,
        credits: creditsBalance,
        requestId,
      });

      logTranslateEvent({
        event: "translate",
        status: "success",
        requestId,
        model: body.model,
        provider,
        latencyMs: Date.now() - startTime,
      });

      if (isNew) attachSessionCookie(response, sessionId);
      return response;
    } catch (error) {
      // Refund on failure if we charged credits
      if (creditsCharged) {
        const refundBalance = grantCredits({
          sessionId,
          amount: 1,
          source: "translation_refund",
          idempotencyKey: `refund:${requestId}`,
        });

        logCreditsEvent({
          event: "credits",
          action: "refund",
          requestId,
          amount: 1,
          source: "translation_refund",
          remaining: refundBalance.remaining,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Translation error:", error);
    const appError = toAppError(error);

    if (modelForLog && providerForLog) {
      logTranslateEvent({
        event: "translate",
        status: "error",
        requestId,
        model: modelForLog,
        provider: providerForLog,
        latencyMs: Date.now() - startTime,
      });
    }

    return jsonError({
      error: appError.message,
      status: appError.statusCode,
      requestId,
      code: appError.code,
    });
  }
}
