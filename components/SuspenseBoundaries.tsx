'use client';

// ===== SUSPENSE BOUNDARIES =====
// Suspense boundary components for streaming.

import { Suspense, ReactNode, ComponentType } from 'react';

/**
 * Loading skeleton component.
 */
function DefaultSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-700 rounded w-1/2" />
    </div>
  );
}

/**
 * Error fallback component.
 */
function _DefaultError({ error }: { error: Error }) {
  return (
    <div className="text-red-500 p-4 border border-red-500/20 rounded">
      <p className="font-medium">Something went wrong</p>
      <p className="text-sm text-red-400">{error.message}</p>
    </div>
  );
}

/**
 * Streaming boundary with custom fallback.
 */
export function StreamBoundary({
  children,
  fallback = <DefaultSkeleton />,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

/**
 * Code editor loading skeleton.
 */
export function EditorSkeleton() {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg p-4">
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className="h-4 bg-gray-800 rounded"
            style={{ width: `${Math.random() * 40 + 40}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Translation panel loading skeleton.
 */
export function TranslationSkeleton() {
  return (
    <div className="w-full h-full bg-gray-900 rounded-lg p-4">
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 bg-gray-700 rounded w-16" />
            <div className="h-4 bg-gray-800 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Header loading skeleton.
 */
export function HeaderSkeleton() {
  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center px-4">
      <div className="h-8 w-32 bg-gray-800 rounded animate-pulse" />
      <div className="flex-1" />
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-gray-800 rounded animate-pulse" />
        <div className="h-8 w-8 bg-gray-800 rounded animate-pulse" />
      </div>
    </header>
  );
}

/**
 * Modal loading skeleton.
 */
export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <div className="h-6 bg-gray-800 rounded w-1/2 mb-4 animate-pulse" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Create a suspense-wrapped component.
 */
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  Fallback: ComponentType = DefaultSkeleton
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={<Fallback />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Deferred render - delay rendering until idle.
 */
export function DeferredRender({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => setIsReady(true));
    } else {
      setTimeout(() => setIsReady(true), 100);
    }
  }, []);
  
  if (!isReady) return null;
  
  return <>{children}</>;
}

import { useState, useEffect } from 'react';

/**
 * Progressive hydration wrapper.
 */
export function ProgressiveHydration({
  children,
  placeholder,
}: {
  children: ReactNode;
  placeholder?: ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    setHydrated(true);
  }, []);
  
  if (!hydrated) {
    return <>{placeholder || <DefaultSkeleton />}</>;
  }
  
  return <>{children}</>;
}
