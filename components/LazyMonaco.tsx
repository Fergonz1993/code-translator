'use client';

// ===== LAZY MONACO LOADER =====
// Dynamically load Monaco editor for faster initial page load.

import dynamic from 'next/dynamic';
import { ComponentType, Suspense, useState, useEffect } from 'react';

// Loading skeleton for Monaco
function MonacoSkeleton() {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-500 flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm">Loading editor...</span>
      </div>
    </div>
  );
}

// Monaco Editor Props type
interface MonacoEditorProps {
  value?: string;
  defaultValue?: string;
  language?: string;
  theme?: string;
  onChange?: (value: string | undefined) => void;
  options?: Record<string, unknown>;
  height?: string | number;
  width?: string | number;
  className?: string;
  onMount?: (editor: unknown, monaco: unknown) => void;
}

// Dynamically import Monaco with no SSR
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <MonacoSkeleton />,
  }
) as ComponentType<MonacoEditorProps>;

// Preload Monaco resources
let preloaded = false;
export function preloadMonaco(): void {
  if (preloaded || typeof window === 'undefined') return;
  preloaded = true;
  
  // Preload the Monaco chunk
  import('@monaco-editor/react').catch(() => {
    // Ignore preload errors
  });
}

// Hook to preload Monaco on idle
export function usePreloadMonaco(): void {
  useEffect(() => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => preloadMonaco());
    } else {
      setTimeout(preloadMonaco, 2000);
    }
  }, []);
}

// Lazy Monaco wrapper with suspense
export function LazyMonacoEditor(props: MonacoEditorProps) {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Small delay to prioritize initial render
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  if (!isReady) {
    return <MonacoSkeleton />;
  }
  
  return (
    <Suspense fallback={<MonacoSkeleton />}>
      <MonacoEditor {...props} />
    </Suspense>
  );
}

// Default export
export default LazyMonacoEditor;

// Export skeleton for reuse
export { MonacoSkeleton };
