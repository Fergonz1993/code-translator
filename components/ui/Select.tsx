// ===== SELECT COMPONENT =====
// Styled dropdown select with options.

import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
        const selectId = id || `select-${Math.random().toString(36).slice(2)}`;

        return (
            <div className="space-y-1">
                {label && (
                    <label
                        htmlFor={selectId}
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={selectId}
                    className={`
            w-full px-3 py-2 rounded-lg
            bg-white dark:bg-slate-800
            border ${error ? "border-red-500" : "border-slate-300 dark:border-slate-600"}
            text-slate-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors cursor-pointer
            ${className}
          `}
                    {...props}
                >
                    {placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="text-xs text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Select.displayName = "Select";
