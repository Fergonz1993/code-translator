// ===== LANGUAGE SELECTOR COMPONENT =====
// A dropdown that lets users pick the programming language they're using.
// Claude needs to know the language to give accurate translations.

"use client"; // This tells Next.js this component runs in the browser

// ===== SUPPORTED LANGUAGES =====
// We support these 4 languages for now. Easy to add more later.
export const LANGUAGES = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "sql", label: "SQL" },
] as const;

// TypeScript magic: extract just the values (typescript, javascript, etc.)
export type Language = (typeof LANGUAGES)[number]["value"];

// ===== COMPONENT PROPS =====
// What this component needs to work
interface LanguageSelectorProps {
  value: Language;                    // Currently selected language
  onChange: (lang: Language) => void; // Function to call when user picks a new one
}

// ===== THE COMPONENT =====
export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Label explaining what this dropdown is */}
      <label
        htmlFor="language-select"
        className="text-sm text-slate-400"
      >
        Language:
      </label>

      {/* The dropdown itself */}
      <select
        id="language-select"
        value={value}
        onChange={(e) => onChange(e.target.value as Language)}
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
        {/* Create an option for each language */}
        {LANGUAGES.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
