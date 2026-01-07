'use client';

// ===== REAL USER MONITORING =====
// RUM metrics collection and reporting.

/**
 * Web Vitals metrics.
 */
export interface WebVitals {
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  fid: number | null; // First Input Delay
  inp: number | null; // Interaction to Next Paint
  lcp: number | null; // Largest Contentful Paint
  ttfb: number | null; // Time to First Byte
}

/**
 * RUM event.
 */
export interface RUMEvent {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  timestamp: number;
}

// Collected metrics
const metrics: Map<string, RUMEvent> = new Map();

/**
 * Report callback function type.
 */
type ReportCallback = (metric: RUMEvent) => void;

// Subscribers
const subscribers: Set<ReportCallback> = new Set();

/**
 * Subscribe to RUM metrics.
 */
export function subscribeToRUM(callback: ReportCallback): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Report a metric.
 */
function reportMetric(metric: RUMEvent): void {
  metrics.set(metric.name, metric);
  subscribers.forEach(cb => cb(metric));
  
  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[RUM] ${metric.name}:`, {
      value: Math.round(metric.value),
      rating: metric.rating,
    });
  }
}

/**
 * Initialize RUM monitoring.
 */
export async function initRUM(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    // Dynamic import web-vitals (optional dependency)
    // @ts-expect-error - web-vitals may not be installed
    const webVitals = await import('web-vitals').catch(() => null);
    if (!webVitals) {
      console.log('[RUM] web-vitals not installed, skipping');
      return;
    }
    
    const { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } = webVitals;
    
    const createReporter = (name: string) => (metric: {
      value: number;
      rating: 'good' | 'needs-improvement' | 'poor';
      delta: number;
      id: string;
      navigationType: string;
    }) => {
      reportMetric({
        name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        timestamp: Date.now(),
      });
    };
    
    onCLS(createReporter('CLS'));
    onFCP(createReporter('FCP'));
    onFID(createReporter('FID'));
    onINP(createReporter('INP'));
    onLCP(createReporter('LCP'));
    onTTFB(createReporter('TTFB'));
  } catch {
    console.warn('[RUM] web-vitals not available');
  }
}

/**
 * Get all collected metrics.
 */
export function getMetrics(): WebVitals {
  return {
    cls: metrics.get('CLS')?.value ?? null,
    fcp: metrics.get('FCP')?.value ?? null,
    fid: metrics.get('FID')?.value ?? null,
    inp: metrics.get('INP')?.value ?? null,
    lcp: metrics.get('LCP')?.value ?? null,
    ttfb: metrics.get('TTFB')?.value ?? null,
  };
}

/**
 * Send metrics to analytics endpoint.
 */
export async function sendMetrics(endpoint: string): Promise<void> {
  const data = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    metrics: Object.fromEntries(metrics),
  };
  
  // Use sendBeacon for reliable delivery
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, JSON.stringify(data));
  } else {
    await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    });
  }
}

/**
 * Custom performance mark.
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Custom performance measure.
 */
export function measure(name: string, startMark: string, endMark?: string): number | null {
  if (typeof performance === 'undefined' || !performance.measure) {
    return null;
  }
  
  try {
    const measure = performance.measure(name, startMark, endMark);
    return measure.duration;
  } catch {
    return null;
  }
}

/**
 * Track long tasks.
 */
export function observeLongTasks(callback: (duration: number) => void): () => void {
  if (typeof PerformanceObserver === 'undefined') {
    return () => {};
  }
  
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry.duration);
      }
    });
    
    observer.observe({ type: 'longtask', buffered: true });
    
    return () => observer.disconnect();
  } catch {
    return () => {};
  }
}

/**
 * Track resource loading times.
 */
export function getResourceTimings(): Array<{
  name: string;
  duration: number;
  size: number;
  type: string;
}> {
  if (typeof performance === 'undefined') return [];
  
  return performance.getEntriesByType('resource').map(entry => {
    const resource = entry as PerformanceResourceTiming;
    return {
      name: resource.name,
      duration: resource.duration,
      size: resource.transferSize,
      type: resource.initiatorType,
    };
  });
}

/**
 * Get navigation timing.
 */
export function getNavigationTiming(): Record<string, number> | null {
  if (typeof performance === 'undefined') return null;
  
  const entries = performance.getEntriesByType('navigation');
  if (entries.length === 0) return null;
  
  const nav = entries[0] as PerformanceNavigationTiming;
  
  return {
    dns: nav.domainLookupEnd - nav.domainLookupStart,
    tcp: nav.connectEnd - nav.connectStart,
    ssl: nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0,
    ttfb: nav.responseStart - nav.requestStart,
    download: nav.responseEnd - nav.responseStart,
    domParse: nav.domInteractive - nav.responseEnd,
    domReady: nav.domContentLoadedEventEnd - nav.startTime,
    load: nav.loadEventEnd - nav.startTime,
  };
}
