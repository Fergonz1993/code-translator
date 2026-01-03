// ===== ENGLISH PANE COMPONENT =====
// The RIGHT side of the app - shows plain English translations of each code line.
// Each line of code gets a corresponding explanation.

"use client"; // This runs in the browser

import type { TranslatedLine } from "@/lib/types";

// ===== COMPONENT PROPS =====
interface EnglishPaneProps {
  translations: TranslatedLine[];  // Array of { line, english } objects
  isLoading: boolean;              // Show loading state
  error: string | null;            // Any error message to display
  hoveredLine: number | null;      // Which line is being hovered (for sync highlighting)
  onHoverLine: (line: number | null) => void; // Called when user hovers a line
}

// ===== THE COMPONENT =====
export function EnglishPane({
  translations,
  isLoading,
  error,
  hoveredLine,
  onHoverLine,
}: EnglishPaneProps) {
  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <h2 className="text-sm font-medium text-slate-300">
          Plain English
        </h2>

        {/* Show count of translated lines */}
        {translations.length > 0 && (
          <span className="text-xs text-slate-500">
            {translations.length} lines
          </span>
        )}
      </div>

      {/* ===== CONTENT AREA ===== */}
      <div className="flex-1 overflow-auto">
        {/* ===== ERROR STATE ===== */}
        {error && (
          <div className="p-4">
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200 text-sm">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* ===== LOADING STATE ===== */}
        {isLoading && translations.length === 0 && (
          <div className="p-4 space-y-3">
            {/* Skeleton loading animation - shows 5 placeholder lines */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* ===== EMPTY STATE ===== */}
        {!isLoading && !error && translations.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm p-8 text-center">
            <div>
              <p className="mb-2">Type or paste code on the left</p>
              <p className="text-xs text-slate-600">
                Translations will appear here automatically
              </p>
            </div>
          </div>
        )}

        {/* ===== TRANSLATIONS LIST ===== */}
        {translations.length > 0 && (
          <div className="p-4 space-y-0">
            {translations.map((item, index) => (
              <div
                key={index}
                className={`
                  flex items-start gap-3 py-2 px-2 rounded-md
                  transition-colors duration-150
                  ${hoveredLine === index
                    ? "bg-blue-900/30"
                    : "hover:bg-slate-800/50"
                  }
                `}
                onMouseEnter={() => onHoverLine(index)}
                onMouseLeave={() => onHoverLine(null)}
              >
                {/* ===== LINE NUMBER ===== */}
                <span className="text-slate-600 text-xs font-mono w-6 text-right flex-shrink-0 pt-0.5">
                  {index + 1}
                </span>

                {/* ===== TRANSLATION ===== */}
                <p className="text-slate-300 text-sm leading-relaxed flex-1">
                  {item.english === "---" ? (
                    // Blank line separator
                    <span className="text-slate-600 italic">
                      (blank line)
                    </span>
                  ) : (
                    item.english
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
