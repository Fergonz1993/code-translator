// ===== SHARED TYPES =====
// All the TypeScript types used across the application.
// Having them in one place makes it easier to understand the data flow.

// ===== AI PROVIDERS =====
// The different AI services we support for translations

export type AIProvider = "openai" | "google" | "anthropic";

// ===== AI MODELS =====
// Specific models available from each provider

export type AIModel =
  | "gpt-4o-mini"      // OpenAI - default, cheap, fast
  | "gpt-4o"           // OpenAI - better but more expensive
  | "gemini-2.0-flash" // Google - very cheap and fast
  | "gemini-1.5-flash" // Google - also cheap
  | "claude-haiku"     // Anthropic - fast
  | "claude-sonnet";   // Anthropic - better quality

// ===== MODEL INFO =====
// Display information for each model

export interface ModelInfo {
  id: AIModel;
  name: string;              // Display name
  provider: AIProvider;
  costPer1000: number;       // Cost per 1000 translations (for display)
  description: string;       // Short description
  isDefault?: boolean;
}

// All available models with their info
export const AVAILABLE_MODELS: ModelInfo[] = [
  // ===== OPENAI MODELS =====
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    costPer1000: 1.50,       // Our price with markup
    description: "Fast & reliable (Recommended)",
    isDefault: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    costPer1000: 5.00,
    description: "Higher quality, slower",
  },
  // ===== GOOGLE MODELS =====
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    costPer1000: 1.00,
    description: "Fastest & cheapest",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "google",
    costPer1000: 0.75,
    description: "Budget option",
  },
  // ===== ANTHROPIC MODELS =====
  {
    id: "claude-haiku",
    name: "Claude Haiku",
    provider: "anthropic",
    costPer1000: 8.00,
    description: "Fast responses",
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet",
    provider: "anthropic",
    costPer1000: 15.00,
    description: "Best quality",
  },
];

// ===== PAYMENT MODE =====
// How the user pays for translations

export type PaymentMode = "credits" | "byok";

// ===== USER SETTINGS =====
// Stored in localStorage

export interface UserSettings {
  // How they're paying
  paymentMode: PaymentMode;

  // Selected AI model
  selectedModel: AIModel;

  // BYOK API keys (only used if paymentMode is "byok")
  apiKeys: {
    openai?: string;
    google?: string;
    anthropic?: string;
  };
}

// Default settings for new users
export const DEFAULT_SETTINGS: UserSettings = {
  paymentMode: "credits",
  selectedModel: "gpt-4o-mini",
  apiKeys: {},
};

// ===== CREDITS =====
// User's credit balance

export interface CreditsState {
  total: number;      // Total credits they've ever had
  used: number;       // Credits used
  remaining: number;  // Credits left (total - used)
}

// New users get 20 free credits
export const INITIAL_CREDITS = 20;

// ===== HISTORY =====
// Past translations saved for reference

export interface HistoryItem {
  id: string;               // Unique ID (UUID or timestamp)
  code: string;             // Original code
  language: string;         // Language name
  model: AIModel;           // Model used
  translations: TranslatedLine[]; // The results
  timestamp: number;        // When it was created
}

export interface HistoryState {
  items: HistoryItem[];
}

export const MAX_HISTORY_ITEMS = 50;

// ===== TRANSLATION REQUEST/RESPONSE =====
// What we send to and receive from the API

export interface TranslateRequest {
  code: string;
  language: string;
  model: AIModel;
  apiKey?: string;    // Only for BYOK mode
}

export interface TranslatedLine {
  line: string;
  english: string;
}

export interface TranslateResponse {
  translations: TranslatedLine[];
  model: AIModel;
  tokensUsed?: number;
}

export interface TranslateError {
  error: string;
  code?: string;
}
