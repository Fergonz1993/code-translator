// ===== AUTOSAVE INDICATOR COMPONENT =====
// Shows autosave status in the UI.

"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudOff, Check, Loader2 } from "lucide-react";

type AutosaveStatus = "idle" | "saving" | "saved" | "error";

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSaved?: Date;
}

export function AutosaveIndicator({ status, lastSaved }: AutosaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  // Show "Saved" briefly then hide
  useEffect(() => {
    if (status === "saved") {
      setShowSaved(true);
      const timeout = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        Saving...
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-500">
        <CloudOff className="w-3 h-3" />
        Save failed
      </span>
    );
  }

  if (showSaved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-500">
        <Check className="w-3 h-3" />
        Saved
      </span>
    );
  }

  if (lastSaved) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
        <Cloud className="w-3 h-3" />
        {formatTime(lastSaved)}
      </span>
    );
  }

  return null;
}

// Hook to manage autosave state
export function useAutosave(save: () => Promise<void>, _delay = 2000) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | undefined>();

  const trigger = async () => {
    setStatus("saving");
    try {
      await save();
      setStatus("saved");
      setLastSaved(new Date());
    } catch {
      setStatus("error");
    }
  };

  return { status, lastSaved, trigger };
}
