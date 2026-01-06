'use client';

// ===== ROUTE PREFETCHING =====
// Intelligent route prefetching for navigation.

import React from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';

/**
 * Routes to prefetch on initial load.
 */
const PRIORITY_ROUTES = [
  '/',
];

/**
 * Routes to prefetch on idle.
 */
const IDLE_ROUTES = [
  '/settings',
  '/history',
];

/**
 * Prefetch routes based on viewport visibility.
 */
export function usePrefetchOnVisibility(route: string): (element: HTMLElement | null) => void {
  const router = useRouter();
  
  return useCallback((element: HTMLElement | null) => {
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            router.prefetch(route);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '100px' }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [router, route]);
}

/**
 * Prefetch routes on hover.
 */
export function usePrefetchOnHover(): {
  onMouseEnter: (route: string) => void;
  onFocus: (route: string) => void;
} {
  const router = useRouter();
  const prefetched = new Set<string>();
  
  const prefetch = useCallback((route: string) => {
    if (!prefetched.has(route)) {
      prefetched.add(route);
      router.prefetch(route);
    }
  }, [router]);
  
  return {
    onMouseEnter: prefetch,
    onFocus: prefetch,
  };
}

/**
 * Prefetch priority routes on mount.
 */
export function usePrefetchPriorityRoutes(): void {
  const router = useRouter();
  
  useEffect(() => {
    PRIORITY_ROUTES.forEach(route => router.prefetch(route));
  }, [router]);
}

/**
 * Prefetch idle routes when browser is idle.
 */
export function usePrefetchIdleRoutes(): void {
  const router = useRouter();
  
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        IDLE_ROUTES.forEach(route => router.prefetch(route));
      });
    } else {
      const timeout = setTimeout(() => {
        IDLE_ROUTES.forEach(route => router.prefetch(route));
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [router]);
}

/**
 * Prefetch based on user behavior patterns.
 */
export function usePredictivePrefetch(): void {
  const router = useRouter();
  
  useEffect(() => {
    // Track which routes user visits most
    const visitCounts = JSON.parse(
      localStorage.getItem('route_visits') || '{}'
    );
    
    // Prefetch top visited routes
    const sortedRoutes = Object.entries(visitCounts)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([route]) => route);
    
    sortedRoutes.forEach(route => router.prefetch(route));
    
    // Track current visit
    const currentPath = window.location.pathname;
    visitCounts[currentPath] = (visitCounts[currentPath] || 0) + 1;
    localStorage.setItem('route_visits', JSON.stringify(visitCounts));
  }, [router]);
}

/**
 * Link wrapper that prefetches on hover.
 */
export function PrefetchLink({
  href,
  children,
  className,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const prefetched = { current: false };
  
  const handleMouseEnter = () => {
    if (!prefetched.current) {
      prefetched.current = true;
      router.prefetch(href);
    }
  };
  
  return (
    <a
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={(e) => {
        e.preventDefault();
        router.push(href);
      }}
      {...props}
    >
      {children}
    </a>
  );
}
