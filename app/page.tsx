// ===== MAIN PAGE =====
// The home page of Code Translator.
// Features:
// - Split-screen: code on left, translations on right
// - Two payment modes: credits or BYOK (bring your own key)
// - Multiple AI models: GPT-4o Mini (default), Gemini, Claude

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ===== COMPONENTS =====
import { CodePane } from "@/components/CodePane";
import { EnglishPane } from "@/components/EnglishPane";
import { type Language } from "@/components/LanguageSelector";
import { SettingsModal } from "@/components/SettingsModal";
import { BuyCreditsModal } from "@/components/BuyCreditsModal";
import { HistoryModal } from "@/components/HistoryModal";

// ===== NEW COMPONENTS =====
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PurchaseMessage } from "@/components/PurchaseMessage";
import { CommandPalette, useDefaultCommands } from "@/components/CommandPalette";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";

// ===== HOOKS =====
import { useDebounce } from "@/hooks/useDebounce";
import { useCredits } from "@/hooks/useCredits";
import { useSettings } from "@/hooks/useSettings";
import { useHistory } from "@/hooks/useHistory";

// ===== TYPES & UTILS =====
import type { AIModel, TranslatedLine } from "@/lib/types";
import { detectLanguage } from "@/lib/language-detection";

// ===== CONSTANTS =====
// Importing from centralized constants to avoid magic numbers
import {
  REQUEST_TIMEOUT_MS,
  CACHE_MAX_ENTRIES,
  UNTRANSLATED_PLACEHOLDER,
  SAMPLE_CODE,
  SAMPLE_TRANSLATIONS,
} from "@/lib/constants";

// ===== CACHE HELPERS =====
function buildCacheKey(line: string, language: Language, model: AIModel): string {
  return `${model}::${language}::${line}`;
}

function enforceCacheLimit(cache: Map<string, string>) {
  if (cache.size <= CACHE_MAX_ENTRIES) return;

  const overflow = cache.size - CACHE_MAX_ENTRIES;
  const keys = cache.keys();

  for (let i = 0; i < overflow; i += 1) {
    const next = keys.next();
    if (next.done) break;
    cache.delete(next.value);
  }
}

function splitLines(codeText: string): string[] {
  return codeText.split(/\r?\n/);
}

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
    isLoaded: creditsLoaded,
    updateCredits,
  } = useCredits();

  const {
    history,
    addToHistory,
    deleteItem: deleteHistoryItem,
    clearHistory,
  } = useHistory();

  // ===== LOCAL STATE =====
  const [code, setCode] = useState(SAMPLE_CODE);
  const [language, setLanguage] = useState<Language>("typescript");
  const [translations, setTranslations] = useState<TranslatedLine[]>(SAMPLE_TRANSLATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [hasUserEdited, setHasUserEdited] = useState(false);
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

  // ===== TRANSLATION CACHE & META =====
  const translationCacheRef = useRef<Map<string, string>>(new Map());
  const lastTranslatedRef = useRef<{
    code: string;
    language: Language;
    model: AIModel;
  } | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);

  // ===== DEBOUNCED CODE =====
  // Wait 800ms after user stops typing before translating
  const debouncedCode = useDebounce(code, 800);

  // ===== MARK SAMPLE AS TRANSLATED =====
  useEffect(() => {
    if (!settingsLoaded) return;
    if (!lastTranslatedRef.current) {
      lastTranslatedRef.current = {
        code: SAMPLE_CODE,
        language: "typescript",
        model: settings.selectedModel,
      };
    }
  }, [settingsLoaded, settings.selectedModel]);

  // ===== SEED CACHE WITH SAMPLE =====
  useEffect(() => {
    if (!settingsLoaded) return;

    const cache = translationCacheRef.current;
    for (const item of SAMPLE_TRANSLATIONS) {
      const key = buildCacheKey(item.line, "typescript", settings.selectedModel);
      if (!cache.has(key)) {
        cache.set(key, item.english);
      }
    }
    enforceCacheLimit(cache);
  }, [settingsLoaded, settings.selectedModel]);

  const isDirty = useMemo(() => {
    const last = lastTranslatedRef.current;
    if (!last) return Boolean(code.trim());

    return (
      last.code !== code ||
      last.language !== language ||
      last.model !== settings.selectedModel
    );
  }, [code, language, settings.selectedModel]);

  // ===== CODE CHANGE HANDLER =====
  const handleCodeChange = useCallback(
    (nextCode: string) => {
      setCode(nextCode);

      if (!hasUserEdited && nextCode !== SAMPLE_CODE) {
        setHasUserEdited(true);
      }

      // Auto-detect language when significant new code is pasted (not typing char by char)
      const isSignificantChange = Math.abs(nextCode.length - code.length) > 20;
      if (isSignificantChange && nextCode.length > 30) {
        const detected = detectLanguage(nextCode);
        if (detected !== "plaintext" && detected !== language) {
          setLanguage(detected as Language);
        }
      }
    },
    [hasUserEdited, code, language]
  );

  // ===== TRANSLATION FUNCTION =====
  const translateCode = useCallback(
    async (codeToTranslate: string, lang: Language) => {
      // Cancel any previous pending request to avoid race conditions
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        currentRequestIdRef.current = null;
      }

      // Don't translate empty code
      if (!codeToTranslate.trim()) {
        setTranslations([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      // Wait for settings to load
      if (!settingsLoaded || !creditsLoaded) return;

      // Keep the sample translation free and immediate
      if (!hasUserEdited && codeToTranslate === SAMPLE_CODE) {
        setTranslations(SAMPLE_TRANSLATIONS);
        setError(null);
        setIsLoading(false);
        abortControllerRef.current = null;
        currentRequestIdRef.current = null;
        lastTranslatedRef.current = {
          code: SAMPLE_CODE,
          language: "typescript",
          model: settings.selectedModel,
        };
        return;
      }

      const lines = splitLines(codeToTranslate);
      const cache = translationCacheRef.current;
      const cachedTranslations = new Map<number, string>();
      const pendingLineNumbers: number[] = [];

      for (let index = 0; index < lines.length; index += 1) {
        const lineNumber = index + 1;
        const lineText = lines[index];

        if (!lineText.trim()) {
          cachedTranslations.set(lineNumber, "---");
          continue;
        }

        const cacheKey = buildCacheKey(lineText, lang, settings.selectedModel);
        const cached = cache.get(cacheKey);

        if (cached) {
          cachedTranslations.set(lineNumber, cached);
        } else {
          pendingLineNumbers.push(lineNumber);
        }
      }

      if (pendingLineNumbers.length === 0) {
        const resolved = lines.map((lineText, index) => ({
          lineNumber: index + 1,
          line: lineText,
          english: cachedTranslations.get(index + 1) || "---",
        }));

        setTranslations(resolved);
        setError(null);
        setIsLoading(false);
        abortControllerRef.current = null;
        currentRequestIdRef.current = null;
        lastTranslatedRef.current = {
          code: codeToTranslate,
          language: lang,
          model: settings.selectedModel,
        };
        return;
      }

      if (settings.paymentMode === "credits" && !hasCredits) {
        setError("You're out of credits. Buy more or add your own API key in Settings.");
        setIsLoading(false);
        abortControllerRef.current = null;
        currentRequestIdRef.current = null;

        const placeholders = lines.map((lineText, index) => ({
          lineNumber: index + 1,
          line: lineText,
          english: cachedTranslations.get(index + 1) || UNTRANSLATED_PLACEHOLDER,
        }));

        setTranslations(placeholders);
        return;
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

      const requestId = crypto.randomUUID();
      currentRequestIdRef.current = requestId;

      try {
        // Build the request
        const requestBody: {
          code: string;
          language: Language;
          model: AIModel;
          lineNumbers: number[];
          requestId: string;
          apiKey?: string;
        } = {
          code: codeToTranslate,
          language: lang,
          model: settings.selectedModel,
          lineNumbers: pendingLineNumbers,
          requestId,
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
          const responseMap = new Map<number, string>();

          for (const item of data.translations as TranslatedLine[]) {
            if (typeof item.lineNumber !== "number" || typeof item.english !== "string") {
              continue;
            }

            responseMap.set(item.lineNumber, item.english);

            if (item.line && item.line.trim()) {
              const key = buildCacheKey(item.line, lang, settings.selectedModel);
              cache.set(key, item.english);
            }
          }

          enforceCacheLimit(cache);

          const merged = lines.map((lineText, index) => {
            const lineNumber = index + 1;
            const english =
              cachedTranslations.get(lineNumber) ||
              responseMap.get(lineNumber) ||
              UNTRANSLATED_PLACEHOLDER;

            return {
              lineNumber,
              line: lineText,
              english,
            };
          });

          setTranslations(merged);

          if (data.credits) {
            updateCredits(data.credits);
          }

          // Add to history
          addToHistory({
            code: codeToTranslate,
            language: lang,
            model: settings.selectedModel,
            translations: merged,
          });

          lastTranslatedRef.current = {
            code: codeToTranslate,
            language: lang,
            model: settings.selectedModel,
          };
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        // Clear timeout on error
        clearTimeout(timeoutId);

        // Ignore aborted requests (user typed again or timeout)
        if (err instanceof Error && err.name === "AbortError") {
          if (currentRequestIdRef.current !== requestId) {
            return;
          }

          // Check if this was a timeout vs a new request cancellation
          if (!abortControllerRef.current || abortControllerRef.current === abortController) {
            setError("Request timed out. Please try again.");
            setIsLoading(false);
          }
          // If it was cancelled by a new request, don't update state
          return;
        }

        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        // Only set loading to false if this is still the active request
        if (abortControllerRef.current === abortController) {
          setIsLoading(false);
          abortControllerRef.current = null;
        }

        if (currentRequestIdRef.current === requestId) {
          currentRequestIdRef.current = null;
        }
      }
    },
    [
      settings.paymentMode,
      settings.selectedModel,
      settingsLoaded,
      creditsLoaded,
      hasCredits,
      hasUserEdited,
      getApiKeyForCurrentModel,
      currentProvider,
      updateCredits,
      addToHistory,
    ]
  );

  // ===== AUTO-TRANSLATE EFFECT =====
  useEffect(() => {
    if (!autoTranslate) return;
    if (!hasUserEdited && debouncedCode === SAMPLE_CODE) return;
    if (!isDirty) return;

    translateCode(debouncedCode, language);
  }, [
    autoTranslate,
    hasUserEdited,
    debouncedCode,
    isDirty,
    language,
    settings.selectedModel,
    translateCode,
  ]);

  const handleManualTranslate = useCallback(() => {
    translateCode(code, language);
  }, [code, language, translateCode]);

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
        setHasUserEdited(true);

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
  // Verify and claim credits after Stripe redirect
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const purchaseStatus = params.get("purchase");
    const sessionId = params.get("session_id");

    if (purchaseStatus === "success" && sessionId) {
      const verifyAndClaim = async () => {
        setPurchaseMessage({ text: "Confirming your purchase...", type: "loading" });

        try {
          const response = await fetch(`/api/credits/claim?session_id=${sessionId}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to verify purchase");
          }

          if (data.status === "pending") {
            setPurchaseMessage({ text: "Payment pending. Please refresh in a moment.", type: "loading" });
            return;
          }

          if (data.status !== "success") {
            throw new Error(data.error || "Failed to claim credits");
          }

          if (data.balance) {
            updateCredits(data.balance);
          }

          setPurchaseMessage({
            text: `Success! ${data.creditsAdded} credits have been added to your balance.`,
            type: "success",
          });

          // Clean up URL and hide message after delays
          urlCleanupTimeoutRef.current = setTimeout(() => {
            if (typeof window !== "undefined") {
              window.history.replaceState({}, "", window.location.pathname);
            }
            messageHideTimeoutRef.current = setTimeout(() => {
              setPurchaseMessage(null);
            }, 5000);
          }, 1000);
        } catch (err) {
          console.error("Credit claim error:", err);
          setPurchaseMessage({
            text: err instanceof Error ? err.message : "Failed to add credits. Please contact support.",
            type: "error",
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
  }, [updateCredits]);

  // ===== RENDER =====
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* ===== PURCHASE STATUS MESSAGE ===== */}
      {purchaseMessage && (
        <PurchaseMessage
          message={purchaseMessage}
          onDismiss={() => setPurchaseMessage(null)}
        />
      )}

      {/* ===== COMMAND PALETTE ===== */}
      <CommandPalette
        commands={useDefaultCommands({
          onOpenSettings: () => setIsSettingsOpen(true),
          onOpenHistory: () => setIsHistoryOpen(true),
          onToggleTheme: () => {
            // Theme handled by ThemeToggle component
            document.documentElement.classList.toggle("dark");
          },
          onBuyCredits: () => setIsBuyCreditsOpen(true),
          onTranslate: handleManualTranslate,
        })}
      />

      {/* ===== ONBOARDING ===== */}
      <OnboardingTutorial />

      {/* ===== HEADER ===== */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        selectedModel={settings.selectedModel}
        onModelChange={setSelectedModel}
        autoTranslate={autoTranslate}
        onAutoTranslateToggle={() => setAutoTranslate((prev) => !prev)}
        onManualTranslate={handleManualTranslate}
        isDirty={isDirty}
        isLoading={isLoading}
        paymentMode={settings.paymentMode}
        credits={credits}
        onBuyMore={handleBuyMore}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* ===== MAIN CONTENT: TWO PANES ===== */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white dark:bg-slate-950">
        {/* LEFT PANE: Code Editor */}
        <div className="flex-1 min-h-[300px] md:min-h-0 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
          <CodePane
            code={code}
            language={language}
            onChange={handleCodeChange}
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
            autoTranslate={autoTranslate}
            isDirty={isDirty}
            onTranslate={handleManualTranslate}
          />
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <Footer />

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
        onCreditsAdded={() => {}}
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
          setHasUserEdited(true);
          setSelectedModel(item.model);
          lastTranslatedRef.current = {
            code: item.code,
            language: item.language as Language,
            model: item.model,
          };
        }}
        onDelete={deleteHistoryItem}
        onClear={clearHistory}
      />
    </div>
  );
}
