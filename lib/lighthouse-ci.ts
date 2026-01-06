// ===== LIGHTHOUSE CI INTEGRATION =====
// Configuration for Lighthouse CI automated audits.

/**
 * Lighthouse CI configuration.
 */
export const lighthouseConfig = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --headless',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

/**
 * Performance budgets.
 */
export const performanceBudgets = {
  // Bundle size budgets
  bundles: {
    'main.js': 200 * 1024, // 200KB
    'vendor.js': 300 * 1024, // 300KB
    'monaco.js': 500 * 1024, // 500KB (large but acceptable)
    'total': 1024 * 1024, // 1MB total
  },
  
  // Resource count budgets
  resources: {
    scripts: 10,
    stylesheets: 5,
    images: 20,
    fonts: 4,
    thirdParty: 5,
  },
  
  // Timing budgets
  timing: {
    'first-contentful-paint': 1500,
    'largest-contentful-paint': 2500,
    'time-to-interactive': 3500,
    'total-blocking-time': 200,
  },
};

/**
 * Generate Lighthouse CI config file content.
 */
export function generateLighthouseRCConfig(): string {
  return JSON.stringify(lighthouseConfig, null, 2);
}

/**
 * CI script for running Lighthouse.
 */
export const lighthouseScript = `
#!/bin/bash
set -e

echo "Starting application..."
npm run build
npm run start &
APP_PID=$!

# Wait for app to be ready
sleep 5

echo "Running Lighthouse CI..."
npx lhci autorun

# Cleanup
kill $APP_PID
`;

/**
 * Parse Lighthouse results.
 */
export interface LighthouseResult {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
  metrics: {
    fcp: number;
    lcp: number;
    cls: number;
    tbt: number;
    tti: number;
    si: number;
  };
}

export function parseLighthouseResult(json: string): LighthouseResult {
  const data = JSON.parse(json);
  const categories = data.categories;
  const audits = data.audits;
  
  return {
    performance: categories.performance?.score || 0,
    accessibility: categories.accessibility?.score || 0,
    bestPractices: categories['best-practices']?.score || 0,
    seo: categories.seo?.score || 0,
    pwa: categories.pwa?.score || 0,
    metrics: {
      fcp: audits['first-contentful-paint']?.numericValue || 0,
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      tbt: audits['total-blocking-time']?.numericValue || 0,
      tti: audits.interactive?.numericValue || 0,
      si: audits['speed-index']?.numericValue || 0,
    },
  };
}

/**
 * Generate performance report.
 */
export function generatePerformanceReport(result: LighthouseResult): string {
  const scoreEmoji = (score: number) => 
    score >= 0.9 ? '🟢' : score >= 0.5 ? '🟡' : '🔴';
  
  return `
# Lighthouse Performance Report

## Scores

| Category | Score |
|----------|-------|
| ${scoreEmoji(result.performance)} Performance | ${Math.round(result.performance * 100)} |
| ${scoreEmoji(result.accessibility)} Accessibility | ${Math.round(result.accessibility * 100)} |
| ${scoreEmoji(result.bestPractices)} Best Practices | ${Math.round(result.bestPractices * 100)} |
| ${scoreEmoji(result.seo)} SEO | ${Math.round(result.seo * 100)} |

## Core Web Vitals

| Metric | Value | Target |
|--------|-------|--------|
| FCP (First Contentful Paint) | ${Math.round(result.metrics.fcp)}ms | < 1800ms |
| LCP (Largest Contentful Paint) | ${Math.round(result.metrics.lcp)}ms | < 2500ms |
| CLS (Cumulative Layout Shift) | ${result.metrics.cls.toFixed(3)} | < 0.1 |
| TBT (Total Blocking Time) | ${Math.round(result.metrics.tbt)}ms | < 200ms |
| TTI (Time to Interactive) | ${Math.round(result.metrics.tti)}ms | < 3800ms |
| SI (Speed Index) | ${Math.round(result.metrics.si)}ms | < 3400ms |
`.trim();
}
