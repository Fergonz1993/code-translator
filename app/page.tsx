// ===== MAIN PAGE =====
// The home page of Code Translator.
// Features:
// - Split-screen: code on left, translations on right
// - Two payment modes: credits or BYOK (bring your own key)
// - Multiple AI models: GPT-4o Mini (default), Gemini, Claude

"use client";

import { useState, useEffect, useCallback } from "react";

// ===== COMPONENTS =====
import { CodePane } from "@/components/CodePane";
import { EnglishPane } from "@/components/EnglishPane";
import { LanguageSelector, type Language } from "@/components/LanguageSelector";
import { ModelSelector } from "@/components/ModelSelector";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { SettingsModal } from "@/components/SettingsModal";

// ===== HOOKS =====
import { useDebounce } from "@/hooks/useDebounce";
import { useCredits } from "@/hooks/useCredits";
import { useSettings } from "@/hooks/useSettings";

// ===== TYPES =====
import type { TranslatedLine } from "@/lib/types";

// ===== SAMPLE CODE =====
// Shows when the app first loads so users understand what it does
const SAMPLE_CODE = `function calculatePAR30(loans: Loan[]) {
  const delinquent = loans.filter(loan => loan.dpd > 30);
  const ratio = delinquent.length / loans.length;
  return ratio * 100;
}`;

// ===== MAIN PAGE COMPONENT =====
export default function Home() {
  // ===== SETTINGS & CREDITS HOOKS =====
  const {
    settings,
    isLoaded: settingsLoaded,
    setPaymentMode,
    setSelectedModel,
    setApiKey,
    currentProvider,
    getApiKeyForCurrentModel,
  } = useSettings();

  const {
    credits,
    hasCredits,
    useCredit,
    isLoaded: creditsLoaded,
  } = useCredits();

  // ===== LOCAL STATE =====
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState<Language>("typescript");
  const [translations, setTranslations] = useState<TranslatedLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ===== DEBOUNCED CODE =====
  // Wait 800ms after user stops typing before translating
  const debouncedCode = useDebounce(code, 800);

  // ===== TRANSLATION FUNCTION =====
  const translateCode = useCallback(
    async (codeToTranslate: string, lang: Language) => {
      // Don't translate empty code
      if (!codeToTranslate.trim()) {
        setTranslations([]);
        return;
      }

      // Wait for settings to load
      if (!settingsLoaded || !creditsLoaded) return;

      // Check if user can translate
      if (settings.paymentMode === "credits" && !hasCredits) {
        setError("You're out of credits. Buy more or add your own API key in Settings.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Build the request
        const requestBody: Record<string, string> = {
          code: codeToTranslate,
          language: lang,
          model: settings.selectedModel,
        };

        // If BYOK mode, include the API key
        if (settings.paymentMode === "byok") {
          const apiKey = getApiKeyForCurrentModel();
          if (!apiKey) {
            throw new Error(
              `No API key found for ${currentProvider}. Please add one in Settings.`
            );
          }
          requestBody.apiKey = apiKey;
        }

        // Call the API
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        // Handle errors
        if (!response.ok) {
          throw new Error(data.error || "Translation failed");
        }

        // Success - update translations
        if (data.translations && Array.isArray(data.translations)) {
          setTranslations(data.translations);

          // Deduct a credit if using credits mode
          if (settings.paymentMode === "credits") {
            useCredit();
          }
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setTranslations([]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      settings.paymentMode,
      settings.selectedModel,
      settingsLoaded,
      creditsLoaded,
      hasCredits,
      getApiKeyForCurrentModel,
      currentProvider,
      useCredit,
    ]
  );

  // ===== AUTO-TRANSLATE EFFECT =====
  useEffect(() => {
    translateCode(debouncedCode, language);
  }, [debouncedCode, language, translateCode]);

  // ===== BUY MORE CREDITS HANDLER =====
  const handleBuyMore = () => {
    // For MVP: just open settings and show a message
    // Later: integrate Stripe
    setIsSettingsOpen(true);
    alert("Credit purchase coming soon! For now, add your own API key to get unlimited translations.");
  };

  // ===== RENDER =====
  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* ===== TOP BAR ===== */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        {/* Left side: Logo + Language selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-white">Code Translator</h1>
            <span className="text-slate-500 text-sm hidden sm:inline">
              Code → English
            </span>
          </div>

          <LanguageSelector value={language} onChange={setLanguage} />
        </div>

        {/* Right side: Model selector + Credits/Settings */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Model selector - full version on desktop */}
          <div className="hidden md:block">
            <ModelSelector
              value={settings.selectedModel}
              onChange={setSelectedModel}
            />
          </div>

          {/* Model indicator - compact version on mobile, opens settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="md:hidden text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded hover:bg-slate-600 transition-colors"
            title="Change model"
          >
            {settings.selectedModel.replace("-", " ").replace("gpt 4o", "GPT-4o").replace("gemini", "Gemini").replace("claude", "Claude")}
          </button>

          {/* Credits display (only in credits mode) */}
          {settings.paymentMode === "credits" && (
            <CreditsDisplay credits={credits} onBuyMore={handleBuyMore} />
          )}

          {/* BYOK indicator */}
          {settings.paymentMode === "byok" && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
              Using your API key
            </span>
          )}

          {/* Settings button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            title="Settings"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* ===== MAIN CONTENT: TWO PANES ===== */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT PANE: Code Editor */}
        <div className="flex-1 min-h-[300px] md:min-h-0 border-b md:border-b-0 md:border-r border-slate-700">
          <CodePane
            code={code}
            language={language}
            onChange={setCode}
            isLoading={isLoading}
            hoveredLine={hoveredLine}
          />
        </div>

        {/* RIGHT PANE: English Translations */}
        <div className="flex-1 min-h-[300px] md:min-h-0">
          <EnglishPane
            translations={translations}
            isLoading={isLoading}
            error={error}
            hoveredLine={hoveredLine}
            onHoverLine={setHoveredLine}
          />
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="px-4 py-2 bg-slate-800 border-t border-slate-700 text-center">
        <p className="text-xs text-slate-500">
          Powered by AI • Translations appear automatically as you type
        </p>
      </footer>

      {/* ===== SETTINGS MODAL ===== */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        paymentMode={settings.paymentMode}
        selectedModel={settings.selectedModel}
        apiKeys={settings.apiKeys}
        onPaymentModeChange={setPaymentMode}
        onModelChange={setSelectedModel}
        onApiKeyChange={setApiKey}
        currentProvider={currentProvider}
      />
    </div>
  );
}
