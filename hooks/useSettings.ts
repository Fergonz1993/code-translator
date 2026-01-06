// ===== USE SETTINGS HOOK =====
// Manages user preferences and BYOK API keys using localStorage.
//
// WHAT IT STORES:
// - Payment mode: "credits" or "byok"
// - Selected AI model: which model to use for translations
// - API keys: user's own keys for BYOK mode (stored locally, never sent to our servers)
//
// SECURITY NOTE:
// API keys are stored in localStorage which is not encrypted.
// This is acceptable for a client-side app where the user controls their own browser.
// Keys are sent to our server to proxy requests, but they are never stored server-side.

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserSettings,
  DEFAULT_SETTINGS,
  PaymentMode,
  AIModel,
  AIProvider,
} from "@/lib/types";

// Key used in localStorage
const STORAGE_KEY = "code-translator-settings";

export function useSettings() {
  // ===== STATE =====
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // ===== LOAD FROM LOCALSTORAGE ON MOUNT =====
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UserSettings;
        // Merge with defaults to handle new fields added in updates
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch {
        console.error("Failed to parse stored settings, using defaults");
      }
    }

    setIsLoaded(true);
  }, []);

  // ===== SAVE TO LOCALSTORAGE WHEN SETTINGS CHANGE =====
  useEffect(() => {
    if (!isLoaded) return;
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      // Handle localStorage quota exceeded (typically 5-10MB limit)
      if (err instanceof Error && err.name === "QuotaExceededError") {
        console.warn("localStorage quota exceeded, settings may not persist");
      }
      // Don't re-throw - app should continue working even if storage fails
    }
  }, [settings, isLoaded]);

  // ===== UPDATE PAYMENT MODE =====
  const setPaymentMode = useCallback((mode: PaymentMode) => {
    setSettings((prev) => ({ ...prev, paymentMode: mode }));
  }, []);

  // ===== UPDATE SELECTED MODEL =====
  const setSelectedModel = useCallback((model: AIModel) => {
    setSettings((prev) => ({ ...prev, selectedModel: model }));
  }, []);

  // ===== UPDATE API KEY FOR A PROVIDER =====
  const setApiKey = useCallback((provider: AIProvider, key: string) => {
    setSettings((prev) => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [provider]: key,
      },
    }));
  }, []);

  // ===== REMOVE API KEY FOR A PROVIDER =====
  const removeApiKey = useCallback((provider: AIProvider) => {
    setSettings((prev) => {
      const newApiKeys = { ...prev.apiKeys };
      delete newApiKeys[provider];
      return { ...prev, apiKeys: newApiKeys };
    });
  }, []);

  // ===== CHECK IF USER HAS API KEY FOR CURRENT MODEL =====
  const getProviderForModel = (model: AIModel): AIProvider => {
    if (model.startsWith("gpt")) return "openai";
    if (model.startsWith("gemini")) return "google";
    return "anthropic";
  };

  const currentProvider = getProviderForModel(settings.selectedModel);
  const hasApiKeyForCurrentModel = Boolean(settings.apiKeys[currentProvider]);

  // ===== CAN USE BYOK? =====
  // User can use BYOK if they have an API key for the selected model's provider
  const canUseBYOK = hasApiKeyForCurrentModel;

  // ===== GET API KEY FOR CURRENT MODEL =====
  const getApiKeyForCurrentModel = (): string | undefined => {
    return settings.apiKeys[currentProvider];
  };

  // ===== RETURN EVERYTHING =====
  return {
    settings,
    isLoaded,
    setPaymentMode,
    setSelectedModel,
    setApiKey,
    removeApiKey,
    currentProvider,
    hasApiKeyForCurrentModel,
    canUseBYOK,
    getApiKeyForCurrentModel,
  };
}
