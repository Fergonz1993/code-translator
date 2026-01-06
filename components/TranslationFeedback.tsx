// ===== TRANSLATION FEEDBACK COMPONENT =====
// Thumbs up/down for translation quality feedback.

"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface TranslationFeedbackProps {
  lineNumber: number;
  onFeedback?: (lineNumber: number, isPositive: boolean | null) => void;
}

export function TranslationFeedback({ lineNumber, onFeedback }: TranslationFeedbackProps) {
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);

  const handleFeedback = (isPositive: boolean) => {
    const newFeedback = isPositive ? "positive" : "negative";
    
    // Toggle off if clicking same button
    if (feedback === newFeedback) {
      setFeedback(null);
      // Notify parent that feedback was cleared
      onFeedback?.(lineNumber, null);
      return;
    }

    setFeedback(newFeedback);
    onFeedback?.(lineNumber, isPositive);
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        onClick={() => handleFeedback(true)}
        className={`
          p-1 rounded transition-colors
          ${feedback === "positive"
            ? "text-green-500 bg-green-500/10"
            : "text-slate-400 hover:text-green-500 hover:bg-green-500/10"
          }
        `}
        title="Good translation"
      >
        <ThumbsUp className="w-3 h-3" />
      </button>
      <button
        type="button"
        onClick={() => handleFeedback(false)}
        className={`
          p-1 rounded transition-colors
          ${feedback === "negative"
            ? "text-red-500 bg-red-500/10"
            : "text-slate-400 hover:text-red-500 hover:bg-red-500/10"
          }
        `}
        title="Bad translation"
      >
        <ThumbsDown className="w-3 h-3" />
      </button>
    </div>
  );
}

