// ===== ANALYTICS EVENTS =====
// Track user interactions for product analytics.

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}

// Event queue for batching
let eventQueue: AnalyticsEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

const FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_QUEUE_SIZE = 50;

/**
 * Track an analytics event.
 */
export function track(name: string, properties?: Record<string, unknown>): void {
  const event: AnalyticsEvent = {
    name,
    properties,
    timestamp: Date.now(),
  };

  eventQueue.push(event);

  // Flush if queue is full
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flush();
    return;
  }

  // Schedule flush
  if (!flushTimeout) {
    flushTimeout = setTimeout(flush, FLUSH_INTERVAL);
  }
}

/**
 * Flush events to analytics service.
 */
async function flush(): Promise<void> {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];

  // In production, send to analytics service
  // await fetch("/api/analytics", { method: "POST", body: JSON.stringify(events) });
  
  // For now, log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", events);
  }
}

// ===== PREDEFINED EVENTS =====

export const Analytics = {
  // Page views
  pageView: (page: string) => track("page_view", { page }),

  // Translation events
  translationStarted: (model: string, language: string) =>
    track("translation_started", { model, language }),
  translationCompleted: (model: string, latencyMs: number, cached: boolean) =>
    track("translation_completed", { model, latencyMs, cached }),
  translationError: (model: string, error: string) =>
    track("translation_error", { model, error }),

  // User actions
  modelChanged: (from: string, to: string) =>
    track("model_changed", { from, to }),
  languageChanged: (from: string, to: string) =>
    track("language_changed", { from, to }),
  themeToggled: (theme: string) =>
    track("theme_toggled", { theme }),
  settingsOpened: () => track("settings_opened"),
  historyOpened: () => track("history_opened"),
  codeExported: (format: string) => track("code_exported", { format }),

  // Purchase events
  purchaseStarted: (packageId: string, amount: number) =>
    track("purchase_started", { packageId, amount }),
  purchaseCompleted: (packageId: string, credits: number) =>
    track("purchase_completed", { packageId, credits }),
  purchaseFailed: (error: string) =>
    track("purchase_failed", { error }),

  // Feature usage
  featureUsed: (feature: string) => track("feature_used", { feature }),
  commandPaletteOpened: () => track("command_palette_opened"),
  shortcutUsed: (shortcut: string) =>
    track("shortcut_used", { shortcut }),
};
