// ===== COPY BUTTON COMPONENT =====
// Copy to clipboard with visual feedback.

"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "md";
}

export function CopyButton({ text, className = "", size = "md" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    // Check for clipboard API support
    if (!navigator.clipboard?.writeText) {
      // Fallback for older browsers
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const padding = size === "sm" ? "p-1" : "p-1.5";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`
        ${padding} rounded transition-colors
        ${copied
          ? "text-green-500 bg-green-500/10"
          : "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
        }
        ${className}
      `}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? <Check className={iconSize} /> : <Copy className={iconSize} />}
    </button>
  );
}

