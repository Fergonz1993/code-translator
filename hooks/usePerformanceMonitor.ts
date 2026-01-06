// ===== PERFORMANCE MONITORING HOOK =====
// Track and report web vitals and custom metrics.

"use client";

import { useEffect, useRef } from "react";

interface PerformanceMetrics {
    // Core Web Vitals
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift

    // Custom metrics
    translationLatency?: number;
    cacheHitRate?: number;
}

export function usePerformanceMonitor() {
    const metricsRef = useRef<PerformanceMetrics>({});

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Observe Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
            metricsRef.current.lcp = lastEntry.startTime;
        });

        try {
            lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
        } catch {
            // Not supported
        }

        // Observe First Input Delay
        const fidObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const firstEntry = entries[0] as PerformanceEntry & { processingStart: number; startTime: number };
            metricsRef.current.fid = firstEntry.processingStart - firstEntry.startTime;
        });

        try {
            fidObserver.observe({ type: "first-input", buffered: true });
        } catch {
            // Not supported
        }

        // Observe Layout Shift
        const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
                const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
                if (!layoutShift.hadRecentInput) {
                    metricsRef.current.cls = (metricsRef.current.cls || 0) + layoutShift.value;
                }
            }
        });

        try {
            clsObserver.observe({ type: "layout-shift", buffered: true });
        } catch {
            // Not supported
        }

        return () => {
            lcpObserver.disconnect();
            fidObserver.disconnect();
            clsObserver.disconnect();
        };
    }, []);

    const trackTranslation = (startTime: number, cached: boolean) => {
        const latency = performance.now() - startTime;
        metricsRef.current.translationLatency = latency;

        // Update cache hit rate
        const currentRate = metricsRef.current.cacheHitRate || 0;
        const alpha = 0.1; // Exponential moving average weight
        metricsRef.current.cacheHitRate = alpha * (cached ? 100 : 0) + (1 - alpha) * currentRate;
    };

    const getMetrics = () => ({ ...metricsRef.current });

    return { trackTranslation, getMetrics };
}
