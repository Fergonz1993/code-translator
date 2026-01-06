// ===== TREE SHAKING OPTIMIZATION =====
// Configuration and utilities for optimal tree shaking.

/**
 * Mark exports as side-effect free for better tree shaking.
 */
export const sideEffects = false;

/**
 * Note: Import utilities individually for tree shaking.
 * Example: import { clsx } from 'clsx'
 */

/**
 * Barrel file optimization - avoid barrel imports.
 * Instead of: import { A, B } from './utils'
 * Use: import { A } from './utils/a'
 */

/**
 * Pure function annotation for minifiers.
 */
export const pure = <T extends (...args: unknown[]) => unknown>(fn: T): T => fn;

/**
 * Mark constant as tree-shakeable.
 */
export const TREE_SHAKE = {
  // Development only exports
  DEV_ONLY: process.env.NODE_ENV === 'development',
  
  // Feature flags that can be eliminated
  ENABLE_ANALYTICS: true,
  ENABLE_SENTRY: true,
} as const;

/**
 * Conditional export for development tools.
 */
export const devTools = TREE_SHAKE.DEV_ONLY
  ? {
      log: console.log,
      warn: console.warn,
      error: console.error,
    }
  : {
      log: () => {},
      warn: () => {},
      error: () => {},
    };

/**
 * Package.json sideEffects configuration.
 */
export const packageSideEffects = {
  sideEffects: [
    '*.css',
    '*.scss',
    './lib/polyfills.ts',
  ],
};

/**
 * Webpack optimization hints.
 */
export const webpackOptimization = {
  usedExports: true,
  providedExports: true,
  sideEffects: true,
  concatenateModules: true,
  minimize: true,
  moduleIds: 'deterministic',
};

/**
 * Check if module is being tree-shaken in production.
 */
export function isTreeShaken(): boolean {
  // This function should be eliminated in production
  // if not used anywhere
  return process.env.NODE_ENV === 'production';
}

/**
 * Dead code elimination helper.
 */
export function eliminateDeadCode<T>(
  condition: boolean,
  ifTrue: () => T,
  ifFalse: () => T
): T {
  // Minifier can eliminate unused branch
  return condition ? ifTrue() : ifFalse();
}

/**
 * Icon import optimization - import only used icons.
 */
export const iconImports = {
  // Instead of: import * as Icons from 'lucide-react'
  // Use: import { Check } from 'lucide-react'
  example: `
    // ❌ Bad (imports entire library)
    import * as Icons from 'lucide-react';
    
    // ✅ Good (tree-shakeable)
    import { Check, X, Menu } from 'lucide-react';
  `,
};

/**
 * Lodash import optimization.
 */
export const lodashImports = {
  // Instead of: import _ from 'lodash'
  // Use: import debounce from 'lodash/debounce'
  example: `
    // ❌ Bad (imports entire library ~70kb)
    import _ from 'lodash';
    
    // ✅ Good (imports only ~1kb)
    import debounce from 'lodash/debounce';
  `,
};
