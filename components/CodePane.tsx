// ===== CODE PANE COMPONENT =====
// The LEFT side of the app - where users write/paste their code.
// Uses Monaco Editor (the same editor that powers VS Code).

"use client"; // This runs in the browser

import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "next-themes";
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
  go: "go",
  rust: "rust",
  java: "java",
  csharp: "csharp",
  cpp: "cpp",
  ruby: "ruby",
  php: "php",
  swift: "swift",
  kotlin: "kotlin",
  sql: "sql",
};

// ===== THE COMPONENT =====
export function CodePane({ code, language, onChange, isLoading, hoveredLine }: CodePaneProps) {
  // Store reference to the Monaco editor instance
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // ===== HANDLE EDITOR MOUNT =====
  // Called once when Monaco finishes loading
  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
  };

  // ===== UPDATE LINE HIGHLIGHT =====
  // When hoveredLine changes, highlight that line in the editor
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // If no line is hovered or invalid line number, clear decorations
    if (hoveredLine === null || hoveredLine < 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    // Check if the line exists in the editor (validate range)
    const model = editor.getModel();
    const totalLines = model?.getLineCount() ?? 0;
    const lineNumber = hoveredLine + 1; // Monaco uses 1-based line numbers

    if (lineNumber > totalLines) {
      // Line doesn't exist in editor, clear decorations
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    // Apply decoration to the valid line
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      [
        {
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: "highlighted-line", // CSS class for styling
            glyphMarginClassName: "highlighted-line-glyph",
          },
        },
      ]
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
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Code
        </h2>

        {/* Loading indicator - subtle pulse when translating */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400">
            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" />
            Translating...
          </div>
        )}
      </div>

      {/* ===== EDITOR ===== */}
      <div className="flex-1 bg-white dark:bg-slate-950">
        <Editor
          height="100%"
          language={MONACO_LANGUAGE_MAP[language]}
          value={code}
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorDidMount}
          theme={mounted ? (resolvedTheme === "dark" ? "vs-dark" : "light") : "vs-dark"}
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
            <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-950">
              <div className="text-slate-400 dark:text-slate-500 text-sm">
                Loading editor...
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
