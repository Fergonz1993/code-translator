// ===== HELPFUL TOOLTIPS =====
// Contextual help tooltips for UI elements.

"use client";

import { useState, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface HelpTooltipProps {
  content: string;
  children?: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export function HelpTooltip({ content, children, position = "top" }: HelpTooltipProps) {
  return (
    <Tooltip content={content} position={position}>
      {children || (
        <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      )}
    </Tooltip>
  );
}

// Common help texts
export const HelpTexts = {
  autoTranslate: "When enabled, translation starts automatically as you type. When disabled, click 'Translate' manually.",
  languageSelector: "Select the programming language of your code for better translation accuracy.",
  modelSelector: "Choose which AI model to use. GPT-4o Mini is fast and affordable. Claude and Gemini offer alternatives.",
  credits: "Credits are consumed for each translation. Purchase more or use your own API key (BYOK).",
  byok: "Bring Your Own Key - use your personal API key for unlimited translations at your own cost.",
  history: "View and restore previous translations. History is stored locally in your browser.",
  export: "Export translations as JSON, Markdown, or plain text files.",
  darkMode: "Toggle between light and dark color themes.",
  commandPalette: "Press ⌘K (Ctrl+K on Windows) to quickly access common actions.",
};

// Inline help component
interface InlineHelpProps {
  text: string;
  className?: string;
}

export function InlineHelp({ text, className = "" }: InlineHelpProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={className}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
      >
        <HelpCircle className="w-3 h-3" />
        {expanded ? "Hide help" : "Need help?"}
      </button>
      
      {expanded && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded">
          {text}
        </p>
      )}
    </div>
  );
}
