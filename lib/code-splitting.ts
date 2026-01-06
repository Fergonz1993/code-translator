// ===== CODE SPLITTING BY ROUTE =====
// Route-based code splitting configuration.

/**
 * Route chunk mapping for manual code splitting.
 */
export const routeChunks = {
  // Main application
  '/': {
    chunks: ['main', 'editor'],
    critical: true,
    preload: true,
  },
  
  // Settings page
  '/settings': {
    chunks: ['settings'],
    critical: false,
    preload: false,
  },
  
  // History page
  '/history': {
    chunks: ['history'],
    critical: false,
    preload: false,
  },
  
  // Pricing page
  '/pricing': {
    chunks: ['pricing', 'stripe'],
    critical: false,
    preload: false,
  },
};

/**
 * Chunk dependencies.
 */
export const chunkDependencies: Record<string, string[]> = {
  editor: ['monaco'],
  settings: ['forms'],
  stripe: ['payment'],
};

/**
 * Get all chunks needed for a route.
 */
export function getRouteChunks(route: string): string[] {
  const config = routeChunks[route as keyof typeof routeChunks];
  if (!config) return ['main'];
  
  // Convert readonly tuple to mutable array
  const allChunks = new Set<string>([...config.chunks]);
  
  // Add dependencies
  for (const chunk of [...config.chunks]) {
    const deps = chunkDependencies[chunk];
    if (deps) {
      deps.forEach(dep => allChunks.add(dep));
    }
  }
  
  return Array.from(allChunks);
}

/**
 * Check if chunk should be preloaded.
 */
export function shouldPreloadChunk(route: string): boolean {
  const config = routeChunks[route as keyof typeof routeChunks];
  return config?.preload ?? false;
}

/**
 * Get critical chunks for initial load.
 */
export function getCriticalChunks(): string[] {
  const critical: string[] = [];
  
  for (const [, config] of Object.entries(routeChunks)) {
    if (config.critical) {
      critical.push(...config.chunks);
    }
  }
  
  return [...new Set(critical)];
}

/**
 * Dynamic import helper with chunk naming.
 */
export function importChunk<T>(
  chunkName: string,
  importFn: () => Promise<T>
): Promise<T> {
  // This helps webpack/turbopack with chunk naming
  return importFn();
}

/**
 * Preload chunks for route.
 */
export async function preloadRouteChunks(route: string): Promise<void> {
  const chunks = getRouteChunks(route);
  
  // Chunk loaders
  const loaders: Record<string, () => Promise<unknown>> = {
    main: () => import('../app/page'),
    settings: () => import('../components/SettingsModal'),
    history: () => import('../components/HistoryModal'),
    editor: () => import('@monaco-editor/react'),
  };
  
  const promises = chunks
    .filter(chunk => chunk in loaders)
    .map(chunk => loaders[chunk]().catch(() => {}));
  
  await Promise.all(promises);
}

/**
 * Next.js config for optimized splitting.
 */
export const splitChunkConfig = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunks
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        // Monaco editor (large)
        monaco: {
          test: /[\\/]node_modules[\\/]monaco-editor[\\/]/,
          name: 'monaco',
          chunks: 'all',
          priority: 20,
        },
        // React/Next core
        framework: {
          test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
          name: 'framework',
          chunks: 'all',
          priority: 10,
        },
      },
    },
  },
};
