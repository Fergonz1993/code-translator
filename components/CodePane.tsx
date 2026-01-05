// ===== CODE PANE COMPONENT =====
// The LEFT side of the app - where users write/paste their code.
// Uses Monaco Editor (the same editor that powers VS Code).

"use client"; // This runs in the browser

import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { Language } from "./LanguageSelector";

// ===== COMPONENT PROPS =====
interface CodePaneProps {
  code: string;                     // The current code in the editor
  language: Language;               // Which programming language for syntax highlighting
  onChange: (code: string) => void; // Called when user types something
  isLoading: boolean;               // Show a subtle indicator when translating
  hoveredLine: number | null;       // Which line is hovered in the English pane (for sync highlighting)
}

// ===== LANGUAGE MAPPING =====
// Monaco uses slightly different language names internally
// This maps our language names to Monaco's expected values
const MONACO_LANGUAGE_MAP: Record<Language, string> = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  sql: "sql",
};

// ===== THE COMPONENT =====
export function CodePane({ code, language, onChange, isLoading, hoveredLine }: CodePaneProps) {
  // Store reference to the Monaco editor instance
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  // ===== HANDLE EDITOR MOUNT =====
  // Called once when Monaco finishes loading
  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
  };

  // ===== UPDATE LINE HIGHLIGHT =====
  // When hoveredLine changes, highlight that line in the editor
  useEffect(() => {
    if (!editorRef.current) return;

    // Clear previous decorations
    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      hoveredLine !== null
        ? [
            {
              range: {
                startLineNumber: hoveredLine + 1, // Monaco uses 1-based line numbers
                startColumn: 1,
                endLineNumber: hoveredLine + 1,
                endColumn: 1,
              },
              options: {
                isWholeLine: true,
                className: "highlighted-line", // CSS class for styling
                glyphMarginClassName: "highlighted-line-glyph",
              },
            },
          ]
        : []
    );
  }, [hoveredLine]);

  return (
    <div className="h-full flex flex-col">
      {/* ===== CUSTOM CSS FOR LINE HIGHLIGHTING ===== */}
      <style jsx global>{`
        .highlighted-line {
          background-color: rgba(59, 130, 246, 0.15) !important;
        }
        .highlighted-line-glyph {
          background-color: rgba(59, 130, 246, 0.3);
          width: 5px !important;
        }
      `}</style>

      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <h2 className="text-sm font-medium text-slate-300">
          Code
        </h2>

        {/* Loading indicator - subtle pulse when translating */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            Translating...
          </div>
        )}
      </div>

      {/* ===== EDITOR ===== */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={MONACO_LANGUAGE_MAP[language]}
          value={code}
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorDidMount}
          theme="vs-dark" // Dark theme to match our app
          options={{
            // ===== EDITOR OPTIONS =====
            minimap: { enabled: false },      // Hide the mini-map (code preview on the right)
            fontSize: 14,                      // Comfortable font size
            lineNumbers: "on",                 // Show line numbers
            scrollBeyondLastLine: false,       // Don't show empty space after code
            wordWrap: "on",                    // Wrap long lines
            padding: { top: 16, bottom: 16 },  // Some breathing room
            automaticLayout: true,             // Resize with container
            tabSize: 2,                        // 2 spaces per tab
            renderWhitespace: "selection",     // Show whitespace only when selected
            cursorBlinking: "smooth",          // Nice cursor animation
            smoothScrolling: true,             // Smooth scrolling
            contextmenu: false,                // Disable right-click menu
          }}
          loading={
            // Show while Monaco is loading (first time only)
            <div className="flex items-center justify-center h-full bg-slate-900">
              <div className="text-slate-500 text-sm">
                Loading editor...
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
