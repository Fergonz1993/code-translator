// ===== MAIN PAGE =====
// The home page of Code Translator.
// Features:
// - Split-screen: code on left, translations on right
// - Two payment modes: credits or BYOK (bring your own key)
// - Multiple AI models: GPT-4o Mini (default), Gemini, Claude

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Clock } from "lucide-react";

// ===== TIMEOUT REFS FOR PURCHASE MESSAGE CLEANUP =====
// Store timeout IDs so we can clean them up when component unmounts

// ===== COMPONENTS =====
import { CodePane } from "@/components/CodePane";
import { EnglishPane } from "@/components/EnglishPane";
import { LanguageSelector, type Language } from "@/components/LanguageSelector";
import { ModelSelector } from "@/components/ModelSelector";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { SettingsModal } from "@/components/SettingsModal";
import { BuyCreditsModal } from "@/components/BuyCreditsModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HistoryModal } from "@/components/HistoryModal";

// ===== HOOKS =====
import { useDebounce } from "@/hooks/useDebounce";
import { useCredits } from "@/hooks/useCredits";
import { useSettings } from "@/hooks/useSettings";
import { useHistory } from "@/hooks/useHistory";

// ===== TYPES =====
import type { TranslatedLine } from "@/lib/types";
import { AVAILABLE_MODELS as MODELS_LIST } from "@/lib/types";

// ===== CONSTANTS =====
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds timeout for API requests

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
    addCredits,
    isLoaded: creditsLoaded,
  } = useCredits();

  const {
    history,
    addToHistory,
    deleteItem: deleteHistoryItem,
    clearHistory,
    isLoaded: historyLoaded,
  } = useHistory();

  // ===== LOCAL STATE =====
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState<Language>("typescript");
  const [translations, setTranslations] = useState<TranslatedLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [purchaseMessage, setPurchaseMessage] = useState<{
    text: string;
    type: "success" | "loading" | "error";
  } | null>(null);

  // ===== ABORT CONTROLLER FOR CANCELLING REQUESTS =====
  // Used to cancel previous requests when a new one is made
  const abortControllerRef = useRef<AbortController | null>(null);

  // ===== TIMEOUT REFS FOR PURCHASE MESSAGE CLEANUP =====
  // Store timeout IDs so we can clean them up when component unmounts
  const urlCleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

      // Cancel any previous pending request to avoid race conditions
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Set timeout to abort request after REQUEST_TIMEOUT_MS
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, REQUEST_TIMEOUT_MS);

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

        // Call the API with abort signal
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        });

        // Clear timeout since request completed
        clearTimeout(timeoutId);

        const data = await response.json();

        // Handle errors
        if (!response.ok) {
          throw new Error(data.error || "Translation failed");
        }

        // Success - update translations
        if (data.translations && Array.isArray(data.translations)) {
          setTranslations(data.translations);

          // Add to history
          addToHistory({
            code: codeToTranslate,
            language: lang,
            model: settings.selectedModel,
            translations: data.translations,
          });

          // Deduct a credit if using credits mode
          if (settings.paymentMode === "credits") {
            useCredit();
          }
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        // Clear timeout on error
        clearTimeout(timeoutId);

        // Ignore aborted requests (user typed again or timeout)
        if (err instanceof Error && err.name === "AbortError") {
          // Check if this was a timeout vs a new request cancellation
          if (!abortControllerRef.current || abortControllerRef.current === abortController) {
            setError("Request timed out. Please try again.");
            setIsLoading(false);
          }
          // If it was cancelled by a new request, don't update state
          return;
        }

        setError(err instanceof Error ? err.message : "Something went wrong");
        setTranslations([]);
      } finally {
        // Only set loading to false if this is still the active request
        if (abortControllerRef.current === abortController) {
          setIsLoading(false);
        }
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

  // ===== HANDLE SHARED LINKS =====
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const sharedCode = params.get("code");
    const sharedLang = params.get("lang");

    if (sharedCode && sharedLang) {
      try {
        // Decode from base64
        const decodedCode = decodeURIComponent(escape(atob(sharedCode)));
        setCode(decodedCode);
        setLanguage(sharedLang as Language);
        
        // Clean up the URL so it doesn't stay there forever
        window.history.replaceState({}, "", window.location.pathname);
      } catch (err) {
        console.error("Failed to decode shared code:", err);
      }
    }
  }, []);

  // ===== BUY MORE CREDITS HANDLER =====
  const handleBuyMore = () => {
    setIsBuyCreditsOpen(true);
  };

  // ===== HANDLE SUCCESSFUL PURCHASE =====
  // Securely verify and claim credits after Stripe redirect
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const purchaseStatus = params.get("purchase");
    const sessionId = params.get("session_id");

    if (purchaseStatus === "success" && sessionId) {
      const verifyAndClaim = async () => {
        setPurchaseMessage({ text: "Confirming your purchase...", type: "loading" });
        
        try {
          // Step 1: Get a signed token from the server
          const getResponse = await fetch(`/api/credits/claim?session_id=${sessionId}`);
          const getData = await getResponse.json();

          if (!getResponse.ok || getData.status !== "success") {
            throw new Error(getData.error || "Failed to verify purchase");
          }

          // Step 2: Use the token to claim credits
          const claimResponse = await fetch("/api/credits/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: getData.token }),
          });

          const claimData = await claimResponse.json();

          if (!claimResponse.ok || !claimData.success) {
            throw new Error(claimData.error || "Failed to claim credits");
          }

          // Step 3: Successfully claimed! Update local state
          addCredits(claimData.credits);
          setPurchaseMessage({ 
            text: `Success! ${claimData.credits} credits have been added to your balance.`, 
            type: "success" 
          });

          // Clean up URL and hide message after delays
          // Using refs to track timeouts so we can clean them up on unmount
          urlCleanupTimeoutRef.current = setTimeout(() => {
            // Only update history if component is still mounted
            if (typeof window !== "undefined") {
              window.history.replaceState({}, "", window.location.pathname);
            }
            // Schedule message hiding after URL cleanup
            messageHideTimeoutRef.current = setTimeout(() => {
              setPurchaseMessage(null);
            }, 5000);
          }, 1000);
          
        } catch (err) {
          console.error("Credit claim error:", err);
          setPurchaseMessage({ 
            text: err instanceof Error ? err.message : "Failed to add credits. Please contact support.", 
            type: "error" 
          });
        }
      };

      verifyAndClaim();
    } else if (purchaseStatus === "cancelled") {
      setPurchaseMessage({ text: "Purchase cancelled.", type: "error" });
      messageHideTimeoutRef.current = setTimeout(() => setPurchaseMessage(null), 5000);
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }

    // Cleanup function: clear any pending timeouts when component unmounts or effect re-runs
    return () => {
      if (urlCleanupTimeoutRef.current) {
        clearTimeout(urlCleanupTimeoutRef.current);
        urlCleanupTimeoutRef.current = null;
      }
      if (messageHideTimeoutRef.current) {
        clearTimeout(messageHideTimeoutRef.current);
        messageHideTimeoutRef.current = null;
      }
    };
  }, [addCredits]);

  // ===== RENDER =====
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* ===== PURCHASE STATUS MESSAGE ===== */}
      {purchaseMessage && (
        <div className={`
          fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-2xl border flex items-center gap-3
          ${purchaseMessage.type === "success" ? "bg-green-500/10 border-green-500/50 text-green-400" : ""}
          ${purchaseMessage.type === "loading" ? "bg-blue-500/10 border-blue-500/50 text-blue-400" : ""}
          ${purchaseMessage.type === "error" ? "bg-red-500/10 border-red-500/50 text-red-400" : ""}
        `}>
          {purchaseMessage.type === "loading" && (
            <svg 
              className="animate-spin h-5 w-5" 
              viewBox="0 0 24 24"
              role="status"
              aria-labelledby="spinner-title"
              focusable="false"
            >
              <title id="spinner-title">Loading…</title>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          <span className="font-medium">{purchaseMessage.text}</span>
          {purchaseMessage.type !== "loading" && (
            <button 
              type="button"
              onClick={() => setPurchaseMessage(null)}
              className="ml-2 hover:opacity-70"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ===== TOP BAR ===== */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        {/* Left side: Logo + Language selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Code Translator</h1>
            <span className="text-slate-500 text-sm hidden sm:inline">
              Code → English
            </span>
          </div>

          <LanguageSelector value={language} onChange={setLanguage} />
        </div>

        {/* Right side: Model selector + Credits/Settings */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
            title="Translation history"
          >
            <Clock className="w-5 h-5" />
          </button>

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
            {MODELS_LIST.find(m => m.id === settings.selectedModel)?.name ?? settings.selectedModel}
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
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-slate-950">
        {/* LEFT PANE: Code Editor */}
        <div className="flex-1 min-h-[300px] md:min-h-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
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
            code={code}
            language={language}
            model={settings.selectedModel}
            translations={translations}
            isLoading={isLoading}
            error={error}
            hoveredLine={hoveredLine}
            onHoverLine={setHoveredLine}
          />
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center transition-colors">
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

      {/* ===== BUY CREDITS MODAL ===== */}
      <BuyCreditsModal
        isOpen={isBuyCreditsOpen}
        onClose={() => setIsBuyCreditsOpen(false)}
        onCreditsAdded={addCredits}
      />

      {/* ===== HISTORY MODAL ===== */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={history}
        onSelect={(item) => {
          setCode(item.code);
          setLanguage(item.language as Language);
          setTranslations(item.translations);
        }}
        onDelete={deleteHistoryItem}
        onClear={clearHistory}
      />
    </div>
  );
}
