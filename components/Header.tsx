// ===== HEADER COMPONENT =====
// Top navigation bar with logo, language selector, model selector, and settings.

"use client";

import { Clock, Settings } from "lucide-react";
import { LanguageSelector, type Language } from "@/components/LanguageSelector";
import { ModelSelector } from "@/components/ModelSelector";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { AIModel, CreditsState } from "@/lib/types";
import { AVAILABLE_MODELS as MODELS_LIST } from "@/lib/types";

// ===== COMPONENT PROPS =====
interface HeaderProps {
    language: Language;
    onLanguageChange: (lang: Language) => void;
    selectedModel: AIModel;
    onModelChange: (model: AIModel) => void;
    autoTranslate: boolean;
    onAutoTranslateToggle: () => void;
    onManualTranslate: () => void;
    isDirty: boolean;
    isLoading: boolean;
    paymentMode: "credits" | "byok";
    credits: CreditsState;
    onBuyMore: () => void;
    onOpenHistory: () => void;
    onOpenSettings: () => void;
}

// ===== THE COMPONENT =====
export function Header({
    language,
    onLanguageChange,
    selectedModel,
    onModelChange,
    autoTranslate,
    onAutoTranslateToggle,
    onManualTranslate,
    isDirty,
    isLoading,
    paymentMode,
    credits,
    onBuyMore,
    onOpenHistory,
    onOpenSettings,
}: HeaderProps) {
    return (
        <header className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
            {/* Left side: Logo + Language selector */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Code Translator</h1>
                    <span className="text-slate-500 text-sm hidden sm:inline">Code → English</span>
                </div>

                <LanguageSelector value={language} onChange={onLanguageChange} />
            </div>

            {/* Right side: Model selector + Credits/Settings */}
            <div className="flex items-center gap-2 sm:gap-4">
                <ThemeToggle />

                <button
                    type="button"
                    onClick={onOpenHistory}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                    title="Translation history"
                >
                    <Clock className="w-5 h-5" />
                </button>

                {/* Model selector - full version on desktop */}
                <div className="hidden md:block">
                    <ModelSelector value={selectedModel} onChange={onModelChange} />
                </div>

                {/* Model indicator - compact version on mobile, opens settings */}
                <button
                    type="button"
                    onClick={onOpenSettings}
                    className="md:hidden text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded hover:bg-slate-600 transition-colors"
                    title="Change model"
                >
                    {MODELS_LIST.find((m) => m.id === selectedModel)?.name ?? selectedModel}
                </button>

                {/* Auto translate toggle - mobile */}
                <button
                    type="button"
                    onClick={onAutoTranslateToggle}
                    className="sm:hidden text-xs border border-slate-600 text-slate-300 px-2 py-1 rounded hover:border-slate-500 transition-colors"
                    title="Toggle auto-translate"
                >
                    {autoTranslate ? "Auto" : "Manual"}
                </button>

                {/* Auto translate toggle + manual button */}
                <div className="hidden sm:flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onAutoTranslateToggle}
                        className={`
              text-xs px-2 py-1 rounded border transition-colors
              ${autoTranslate
                                ? "border-blue-500 text-blue-500 bg-blue-500/10"
                                : "border-slate-500 text-slate-400 hover:text-slate-200"
                            }
            `}
                        title="Toggle auto-translate"
                    >
                        {autoTranslate ? "Auto" : "Manual"}
                    </button>
                    <button
                        type="button"
                        onClick={onManualTranslate}
                        disabled={autoTranslate || !isDirty || isLoading}
                        className={`
              text-xs px-2 py-1 rounded transition-colors
              ${autoTranslate || !isDirty || isLoading
                                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-500"
                            }
            `}
                        title="Translate now"
                    >
                        Translate
                    </button>
                </div>

                {/* Credits display (only in credits mode) */}
                {paymentMode === "credits" && (
                    <CreditsDisplay credits={credits} onBuyMore={onBuyMore} />
                )}

                {/* BYOK indicator */}
                {paymentMode === "byok" && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                        Using your API key
                    </span>
                )}

                {/* Settings button */}
                <button
                    type="button"
                    onClick={onOpenSettings}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
