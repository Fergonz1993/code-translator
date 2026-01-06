// ===== RADIO GROUP COMPONENT =====
// Radio button group with accessible markup.

"use client";

import { createContext, useContext, type ReactNode } from "react";

// ===== CONTEXT =====
interface RadioGroupContextValue {
  value: string;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

function useRadioGroupContext() {
  const context = useContext(RadioGroupContext);
  if (!context) throw new Error("RadioItem must be used within RadioGroup");
  return context;
}

// ===== RADIO GROUP =====
interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  name?: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function RadioGroup({
  value,
  onChange,
  name = `radio-${Math.random().toString(36).slice(2)}`,
  children,
  disabled,
  className = "",
  orientation = "vertical",
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onChange, name, disabled }}>
      <div
        role="radiogroup"
        className={`
          ${orientation === "horizontal" ? "flex flex-wrap gap-4" : "space-y-2"}
          ${className}
        `}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

// ===== RADIO ITEM =====
interface RadioItemProps {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function RadioItem({
  value,
  label,
  description,
  disabled: itemDisabled,
  className = "",
}: RadioItemProps) {
  const { value: groupValue, onChange, name, disabled: groupDisabled } = useRadioGroupContext();
  const isChecked = groupValue === value;
  const isDisabled = itemDisabled || groupDisabled;

  return (
    <label
      className={`
        flex items-start gap-3 cursor-pointer
        ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {/* Custom radio */}
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="radio"
          name={name}
          value={value}
          checked={isChecked}
          onChange={() => onChange(value)}
          disabled={isDisabled}
          className="sr-only peer"
        />
        <div
          className={`
            w-5 h-5 rounded-full border-2 transition-colors
            border-slate-300 dark:border-slate-600
            peer-checked:border-blue-500
            peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2
          `}
        />
        <div
          className={`
            absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-blue-500
            scale-0 peer-checked:scale-100 transition-transform
          `}
        />
      </div>

      {/* Label and description */}
      <div className="flex-1">
        <span className="text-sm font-medium text-slate-900 dark:text-white">
          {label}
        </span>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
    </label>
  );
}
