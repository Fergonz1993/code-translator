// ===== TRANSLATE LOGGING =====
// Structured logging helpers for /api/translate.

import type { AIModel, AIProvider } from "@/lib/types";

export type TranslateLogEntry = {
  event: "translate";
  status: "success" | "error";
  requestId: string;
  model: AIModel;
  provider: AIProvider;
  latencyMs: number;
  cached?: boolean;
};

export function buildTranslateLog(entry: TranslateLogEntry) {
  return {
    event: entry.event,
    status: entry.status,
    requestId: entry.requestId,
    model: entry.model,
    provider: entry.provider,
    latencyMs: entry.latencyMs,
    cached: entry.cached ?? false,
  };
}

export function logTranslateEvent(entry: TranslateLogEntry) {
  const payload = buildTranslateLog(entry);
  const message = JSON.stringify(payload);

  if (entry.status === "error") {
    console.error(message);
  } else {
    console.info(message);
  }
}
