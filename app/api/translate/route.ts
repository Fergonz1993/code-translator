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

// ===== HELPER: Parse and validate AI response =====
// Ensures the JSON response has the expected structure
function parseTranslationResponse(content: string): TranslatedLine[] {
  if (!content || content.trim() === "") {
    throw new Error("Empty response from AI provider");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  // Validate it's an array
  if (!Array.isArray(parsed)) {
    throw new Error("AI response is not an array. Please try again.");
  }

  // Validate each item has the required fields
  const translations: TranslatedLine[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) {
      throw new Error("Invalid translation item format");
    }
    if (typeof item.line !== "string" || typeof item.english !== "string") {
      throw new Error("Translation missing 'line' or 'english' field");
    }
    translations.push({ line: item.line, english: item.english });
  }

  return translations;
}

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

// ===== THE PROMPT =====
// Same prompt for all providers - tells the AI what we want
function getPrompt(code: string, language: string): string {
  return `You are a code-to-English translator. Translate this ${language} code into plain English, LINE BY LINE.

RULES:
- Each line of code gets ONE explanation
- Keep explanations SHORT (10-15 words max)
- Use simple, everyday language (like explaining to someone who doesn't code)
- For blank lines, return "---"
- For comments, say "Note: [what the comment says]"
- For closing braces/brackets alone, say "End of [what block it closes]"
- NO technical jargon - use everyday words
- Focus on WHAT it does, not HOW it works technically

Return ONLY a valid JSON array, no markdown, no code blocks:
[
  { "line": "original code line here", "english": "plain English translation here" },
  { "line": "next line", "english": "translation" }
]

CODE TO TRANSLATE:
${code}`;
}

// ===== OPENAI TRANSLATION =====
async function translateWithOpenAI(
  code: string,
  language: string,
  model: AIModel,
  apiKey: string
): Promise<TranslatedLine[]> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: getModelId(model),
    messages: [
      {
        role: "user",
        content: getPrompt(code, language),
      },
    ],
    temperature: 0.3, // Lower = more consistent/deterministic
  });

  const content = response.choices[0]?.message?.content || "";
  return parseTranslationResponse(content);
}

// ===== GOOGLE GEMINI TRANSLATION =====
async function translateWithGemini(
  code: string,
  language: string,
  model: AIModel,
  apiKey: string
): Promise<TranslatedLine[]> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model: getModelId(model) });

  const result = await geminiModel.generateContent(getPrompt(code, language));
  const content = result.response.text();

  // Gemini sometimes wraps JSON in markdown code blocks, clean it
  const cleanedContent = content
    .replace(/^```(?:json)?\s*/gm, "")  // Matches ``` or ```json at line start
    .replace(/```\s*$/gm, "")           // Matches ``` at line end
    .trim();

  return parseTranslationResponse(cleanedContent);
}

// ===== ANTHROPIC CLAUDE TRANSLATION =====
async function translateWithClaude(
  code: string,
  language: string,
  model: AIModel,
  apiKey: string
): Promise<TranslatedLine[]> {
  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: getModelId(model),
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: getPrompt(code, language),
      },
    ],
  });

  const content =
    message.content[0].type === "text" ? message.content[0].text : "";
  return parseTranslationResponse(content);
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

    // ===== STEP 3: Determine which API key to use =====
    const provider = getProviderForModel(body.model);
    let apiKey: string | undefined;

    if (body.apiKey) {
      // BYOK mode: user provided their own key
      apiKey = body.apiKey;
    } else {
      // Credits mode: use our API key from environment
      const envKeyMap: Record<AIProvider, string | undefined> = {
        openai: process.env.OPENAI_API_KEY,
        google: process.env.GOOGLE_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
      };
      apiKey = envKeyMap[provider];
    }

    // ===== STEP 4: Check we have an API key =====
    if (!apiKey) {
      const message = body.apiKey
        ? "Invalid API key provided"
        : `No API key configured for ${provider}. Please add your own API key in Settings.`;

      return NextResponse.json({ error: message }, { status: 400 });
    }

    // ===== STEP 5: Call the appropriate provider =====
    let translations: TranslatedLine[];

    switch (provider) {
      case "openai":
        translations = await translateWithOpenAI(
          body.code,
          body.language,
          body.model,
          apiKey
        );
        break;
      case "google":
        translations = await translateWithGemini(
          body.code,
          body.language,
          body.model,
          apiKey
        );
        break;
      case "anthropic":
        translations = await translateWithClaude(
          body.code,
          body.language,
          body.model,
          apiKey
        );
        break;
      default:
        return NextResponse.json(
          { error: `Unknown provider: ${provider}` },
          { status: 400 }
        );
    }

    // ===== STEP 6: Return the translations =====
    return NextResponse.json({
      translations,
      model: body.model,
    });
  } catch (error) {
    // ===== ERROR HANDLING =====
    console.error("Translation error:", error);

    let errorMessage = "Translation failed";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle common API errors with user-friendly messages
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
