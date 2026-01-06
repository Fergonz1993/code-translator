// ===== SWITCH COMPONENT =====
// Toggle switch for boolean settings.

"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, className = "", id, checked, onChange, disabled, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).slice(2)}`;

    return (
      <label
        htmlFor={switchId}
        className={`
          flex items-center gap-3 cursor-pointer
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${className}
        `}
      >
        {/* Switch track */}
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div
            className={`
              w-11 h-6 rounded-full transition-colors
              bg-slate-200 dark:bg-slate-700
              peer-checked:bg-blue-500
              peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2
            `}
          />
          <div
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 rounded-full
              bg-white shadow transition-transform
              peer-checked:translate-x-5
            `}
          />
        </div>

        {/* Label and description */}
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {label}
              </span>
            )}
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";
