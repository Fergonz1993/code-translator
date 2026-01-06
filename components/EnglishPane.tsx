// ===== ENGLISH PANE COMPONENT =====
// The RIGHT side of the app - shows plain English translations of each code line.
// Each line of code gets a corresponding explanation.

"use client"; // This runs in the browser

import { useState } from "react";
import { FileText, FileCode, FileJson, Share2, Check } from "lucide-react";
import type { TranslatedLine } from "@/lib/types";
import { exportToTxt, exportToMarkdown, exportToJson, generateShareUrl } from "@/lib/export-utils";

// ===== COMPONENT PROPS =====
interface EnglishPaneProps {
  code: string;                    // The original code (for exporting)
  language: string;                // The language name (for exporting)
  model: string;                   // The model name (for exporting)
  translations: TranslatedLine[];  // Array of { lineNumber, line, english } objects
  isLoading: boolean;              // Show loading state
  error: string | null;            // Any error message to display
  autoTranslate: boolean;          // Whether auto-translate is enabled
  isDirty: boolean;                // Whether translations are out of date
  hoveredLine: number | null;      // Which line is being hovered (for sync highlighting)
  onHoverLine: (line: number | null) => void; // Called when user hovers a line
  onTranslate: () => void;         // Manual translation trigger
}

// ===== THE COMPONENT =====
export function EnglishPane({
  code,
  language,
  model,
  translations,
  isLoading,
  error,
  autoTranslate,
  isDirty,
  hoveredLine,
  onHoverLine,
  onTranslate,
}: EnglishPaneProps) {
  const [isShared, setIsShared] = useState(false);

  const handleShare = () => {
    const url = generateShareUrl(code, language);
    navigator.clipboard.writeText(url);
    setIsShared(true);
    setTimeout(() => setIsShared(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 transition-colors">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Plain English
          </h2>

          {/* Export Buttons - only show if there are translations */}
          {!isLoading && translations.length > 0 && (
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 ml-2 pl-4">
              <button
                type="button"
                onClick={() => exportToTxt(code, translations)}
                className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                title="Export as Text"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => exportToMarkdown(code, language, translations)}
                className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                title="Export as Markdown"
              >
                <FileCode className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => exportToJson(code, language, model, translations)}
                className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                title="Export as JSON"
              >
                <FileJson className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={handleShare}
                className={`p-1.5 transition-all ${isShared ? "text-green-500" : "text-slate-400 hover:text-blue-500"}`}
                title="Copy share link"
              >
                {isShared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Right-side controls */}
        <div className="flex items-center gap-3">
          {!autoTranslate && (
            <button
              type="button"
              onClick={onTranslate}
              disabled={!isDirty || isLoading}
              className={`
                sm:hidden text-xs px-2 py-1 rounded transition-colors
                ${!isDirty || isLoading
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-500"
                }
              `}
            >
              Translate
            </button>
          )}

          {translations.length > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {translations.length} lines
            </span>
          )}
        </div>
      </div>

      {/* ===== CONTENT AREA ===== */}
      <div className="flex-1 overflow-auto">
        {/* ===== MANUAL MODE NOTICE ===== */}
        {!autoTranslate && isDirty && (
          <div className="px-4 pt-4">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-amber-700 dark:text-amber-200 text-xs">
              Auto-translate is off. Click Translate to update these lines.
            </div>
          </div>
        )}

        {/* ===== ERROR STATE ===== */}
        {error && (
          <div className="p-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-200 text-sm">
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
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {/* ===== EMPTY STATE ===== */}
        {!isLoading && !error && translations.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm p-8 text-center">
            <div>
              <p className="mb-2">Type or paste code on the left</p>
              <p className="text-xs text-slate-400 dark:text-slate-600">
                Translations will appear here automatically
              </p>
            </div>
          </div>
        )}

        {/* ===== TRANSLATIONS LIST ===== */}
        {translations.length > 0 && (
          <div className="p-4 space-y-0">
            {translations.map((item) => {
              const lineIndex = item.lineNumber - 1;
              return (
                <div
                  key={item.lineNumber}
                  role="listitem"
                  tabIndex={0}
                  className={`
                  flex items-start gap-3 py-2 px-2 rounded-md
                  transition-colors duration-150
                  ${hoveredLine === lineIndex
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }
                `}
                  onMouseEnter={() => onHoverLine(lineIndex)}
                  onMouseLeave={() => onHoverLine(null)}
                  onFocus={() => onHoverLine(lineIndex)}
                  onBlur={() => onHoverLine(null)}
                >
                  {/* ===== LINE NUMBER ===== */}
                  <span className="text-slate-400 dark:text-slate-600 text-xs font-mono w-6 text-right flex-shrink-0 pt-0.5">
                    {item.lineNumber}
                  </span>

                  {/* ===== TRANSLATION ===== */}
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed flex-1">
                    {item.english === "---" ? (
                      // Blank line separator
                      <span className="text-slate-400 dark:text-slate-600 italic">
                        (blank line)
                      </span>
                    ) : (
                      item.english
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
