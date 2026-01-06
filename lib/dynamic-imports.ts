// ===== DYNAMIC IMPORTS OPTIMIZER =====
// Utilities for optimizing bundle size with dynamic imports.

/**
 * Create a lazy-loaded component with custom loading/error states.
 */
export function createLazyComponent<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    preload?: boolean;
  } = {}
) {
  // Start preloading if requested
  if (options.preload && typeof window !== 'undefined') {
    importFn().catch(() => {});
  }
  
  return {
    Component: importFn,
    preload: () => importFn(),
  };
}

/**
 * Lazy import a module only when needed.
 */
export async function lazyImport<T>(
  importFn: () => Promise<T>
): Promise<T> {
  return importFn();
}

/**
 * Preload a dynamic import during idle time.
 */
export function preloadOnIdle(importFn: () => Promise<unknown>): void {
  if (typeof window === 'undefined') return;
  
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => importFn().catch(() => {}));
  } else {
    setTimeout(() => importFn().catch(() => {}), 2000);
  }
}

/**
 * Preload on hover/focus.
 */
export function createPreloadHandler(
  importFn: () => Promise<unknown>
): () => void {
  let preloaded = false;
  
  return () => {
    if (!preloaded) {
      preloaded = true;
      importFn().catch(() => {});
    }
  };
}

/**
 * Component mapping for dynamic loading.
 */
export const LAZY_COMPONENTS = {
  SettingsModal: () => import('../components/SettingsModal'),
  HistoryModal: () => import('../components/HistoryModal'),
  BuyCreditsModal: () => import('../components/BuyCreditsModal'),
  CommandPalette: () => import('../components/CommandPalette'),
  OnboardingTutorial: () => import('../components/OnboardingTutorial'),
} as const;

/**
 * Preload critical components after initial render.
 */
export function preloadCriticalComponents(): void {
  preloadOnIdle(LAZY_COMPONENTS.SettingsModal);
  preloadOnIdle(LAZY_COMPONENTS.CommandPalette);
}

/**
 * Route-based code splitting hints.
 */
export const ROUTE_CHUNKS = {
  '/': ['main', 'monaco'],
  '/settings': ['settings'],
  '/history': ['history'],
  '/pricing': ['pricing', 'stripe'],
} as const;

/**
 * Get chunk names for a route.
 */
export function getRouteChunks(path: string): string[] {
  const chunks = ROUTE_CHUNKS[path as keyof typeof ROUTE_CHUNKS];
  return chunks ? [...chunks] : ['main'];
}

/**
 * Analyze imports in development.
 */
export function analyzeImports(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.log('[Bundle Analysis] Lazy components:', Object.keys(LAZY_COMPONENTS));
  console.log('[Bundle Analysis] Route chunks:', ROUTE_CHUNKS);
}
