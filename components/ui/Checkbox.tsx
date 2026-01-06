// ===== CHECKBOX COMPONENT =====
// Styled checkbox with label support.

"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { Check } from "lucide-react";

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className = "", id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2)}`;

    return (
      <div className={className}>
        <label htmlFor={checkboxId} className="flex items-start gap-3 cursor-pointer">
          {/* Custom checkbox */}
          <div className="relative flex-shrink-0 mt-0.5">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              className="sr-only peer"
              {...props}
            />
            <div
              className={`
                w-5 h-5 rounded border-2 transition-colors
                ${error
                  ? "border-red-500"
                  : "border-slate-300 dark:border-slate-600 peer-checked:border-blue-500 peer-checked:bg-blue-500"
                }
                peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2
                peer-disabled:opacity-50 peer-disabled:cursor-not-allowed
              `}
            />
            <Check
              className={`
                absolute top-0.5 left-0.5 w-4 h-4 text-white
                opacity-0 peer-checked:opacity-100 transition-opacity
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

        {/* Error message */}
        {error && (
          <p className="mt-1 text-xs text-red-500 ml-8">{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
