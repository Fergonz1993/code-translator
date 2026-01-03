// ===== MODEL SELECTOR COMPONENT =====
// Dropdown to select which AI model to use for translations.
// Shows the model name and a subtle indicator of the provider.

"use client";

import { AVAILABLE_MODELS, AIModel } from "@/lib/types";

interface ModelSelectorProps {
  value: AIModel;
  onChange: (model: AIModel) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  // Find current model info
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === value);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="model-select" className="text-sm text-slate-400">
        Model:
      </label>

      <select
        id="model-select"
        value={value}
        onChange={(e) => onChange(e.target.value as AIModel)}
        className="
          bg-slate-800
          text-white
          border border-slate-600
          rounded-md
          px-3 py-1.5
          text-sm
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          cursor-pointer
          hover:border-slate-500
          transition-colors
        "
      >
        {AVAILABLE_MODELS.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>

      {/* Show provider badge */}
      {currentModel && (
        <span className="text-xs text-slate-500 hidden sm:inline">
          ({currentModel.provider})
        </span>
      )}
    </div>
  );
}
