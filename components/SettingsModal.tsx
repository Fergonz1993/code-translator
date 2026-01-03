// ===== SETTINGS MODAL COMPONENT =====
// Modal dialog where users configure their payment mode and API keys.
//
// TWO MODES:
// 1. Credits mode (default): Use our API, pay with credits
// 2. BYOK mode: Use their own API key, unlimited and free

"use client";

import { useState } from "react";
import {
  PaymentMode,
  AIProvider,
  AVAILABLE_MODELS,
  AIModel,
} from "@/lib/types";

// ===== COMPONENT PROPS =====
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Current settings
  paymentMode: PaymentMode;
  selectedModel: AIModel;
  apiKeys: Record<string, string | undefined>;
  // Update functions
  onPaymentModeChange: (mode: PaymentMode) => void;
  onModelChange: (model: AIModel) => void;
  onApiKeyChange: (provider: AIProvider, key: string) => void;
  // Current provider (derived from selected model)
  currentProvider: AIProvider;
}

// ===== PROVIDER INFO =====
// Display information for each AI provider
const PROVIDERS: { id: AIProvider; name: string; keyPrefix: string; helpUrl: string }[] = [
  {
    id: "openai",
    name: "OpenAI",
    keyPrefix: "sk-",
    helpUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "google",
    name: "Google AI",
    keyPrefix: "AI",
    helpUrl: "https://aistudio.google.com/app/apikey",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    keyPrefix: "sk-ant-",
    helpUrl: "https://console.anthropic.com/",
  },
];

// ===== THE COMPONENT =====
export function SettingsModal({
  isOpen,
  onClose,
  paymentMode,
  selectedModel,
  apiKeys,
  onPaymentModeChange,
  onModelChange,
  onApiKeyChange,
  currentProvider,
}: SettingsModalProps) {
  // Local state for API key input (before saving)
  const [keyInput, setKeyInput] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(currentProvider);

  // Don't render if modal is closed
  if (!isOpen) return null;

  // Get current provider info
  const providerInfo = PROVIDERS.find((p) => p.id === selectedProvider)!;

  // Handle saving API key
  const handleSaveKey = () => {
    if (keyInput.trim()) {
      onApiKeyChange(selectedProvider, keyInput.trim());
      setKeyInput("");
    }
  };

  // Handle removing API key
  const handleRemoveKey = (provider: AIProvider) => {
    onApiKeyChange(provider, "");
  };

  return (
    // ===== BACKDROP =====
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      {/* ===== MODAL CONTAINER ===== */}
      <div
        className="bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="p-4 space-y-6">
          {/* ===== PAYMENT MODE SECTION ===== */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">
              How do you want to pay for translations?
            </h3>

            <div className="space-y-2">
              {/* Credits option */}
              <label
                className={`
                  flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${paymentMode === "credits"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-600 hover:border-slate-500"
                  }
                `}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  checked={paymentMode === "credits"}
                  onChange={() => onPaymentModeChange("credits")}
                  className="mt-1"
                />
                <div>
                  <div className="text-white font-medium">Use credits</div>
                  <div className="text-sm text-slate-400">
                    20 free credits to start. Buy more when you need them.
                  </div>
                </div>
              </label>

              {/* BYOK option */}
              <label
                className={`
                  flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${paymentMode === "byok"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-600 hover:border-slate-500"
                  }
                `}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  checked={paymentMode === "byok"}
                  onChange={() => onPaymentModeChange("byok")}
                  className="mt-1"
                />
                <div>
                  <div className="text-white font-medium">Use my own API key (BYOK)</div>
                  <div className="text-sm text-slate-400">
                    Unlimited translations. Your key stays in your browser.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* ===== BYOK API KEY SECTION ===== */}
          {paymentMode === "byok" && (
            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">
                Your API Keys
              </h3>

              {/* Saved keys */}
              <div className="space-y-2 mb-4">
                {PROVIDERS.map((provider) => {
                  const hasKey = Boolean(apiKeys[provider.id]);
                  return (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300">{provider.name}</span>
                        {hasKey ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            Configured
                          </span>
                        ) : (
                          <span className="text-xs bg-slate-600 text-slate-400 px-2 py-0.5 rounded">
                            Not set
                          </span>
                        )}
                      </div>
                      {hasKey && (
                        <button
                          onClick={() => handleRemoveKey(provider.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add new key */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
                    className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={`Paste your ${providerInfo.name} API key...`}
                    className="flex-1 bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm placeholder:text-slate-500"
                  />
                  <button
                    onClick={handleSaveKey}
                    disabled={!keyInput.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Save
                  </button>
                </div>

                <a
                  href={providerInfo.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Get your {providerInfo.name} API key →
                </a>

                <p className="text-xs text-slate-500">
                  Your API key is stored only in your browser&apos;s local storage.
                  It&apos;s never sent to our servers.
                </p>
              </div>
            </div>
          )}

          {/* ===== MODEL SELECTION ===== */}
          <div className="border-t border-slate-700 pt-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">
              AI Model
            </h3>

            <div className="space-y-2">
              {AVAILABLE_MODELS.map((model) => (
                <label
                  key={model.id}
                  className={`
                    flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors
                    ${selectedModel === model.id
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-600 hover:border-slate-500"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="model"
                      checked={selectedModel === model.id}
                      onChange={() => onModelChange(model.id)}
                    />
                    <div>
                      <div className="text-white font-medium flex items-center gap-2">
                        {model.name}
                        {model.isDefault && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {model.description}
                      </div>
                    </div>
                  </div>
                  {paymentMode === "credits" && (
                    <div className="text-xs text-slate-500">
                      ~${model.costPer1000}/1k
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
