// ===== MEMORY PROFILING =====
// Memory profiling and leak detection utilities.

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  rss: number;
  timestamp: number;
}

export interface LeakReport {
  suspected: boolean;
  growthRate: number; // MB per minute
  samples: MemoryStats[];
  recommendation: string;
}

const memoryHistory: MemoryStats[] = [];
const MAX_HISTORY = 60; // 60 samples

/**
 * Get current memory statistics.
 */
export function getMemoryStats(): MemoryStats | null {
  if (typeof process === 'undefined' || !process.memoryUsage) {
    return null;
  }
  
  const usage = process.memoryUsage();
  
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    arrayBuffers: usage.arrayBuffers || 0,
    rss: usage.rss,
    timestamp: Date.now(),
  };
}

/**
 * Record memory sample.
 */
export function recordMemorySample(): MemoryStats | null {
  const stats = getMemoryStats();
  
  if (stats) {
    memoryHistory.push(stats);
    if (memoryHistory.length > MAX_HISTORY) {
      memoryHistory.shift();
    }
  }
  
  return stats;
}

/**
 * Analyze memory for potential leaks.
 */
export function analyzeMemoryLeak(): LeakReport {
  if (memoryHistory.length < 10) {
    return {
      suspected: false,
      growthRate: 0,
      samples: [...memoryHistory],
      recommendation: 'Need more samples (min 10)',
    };
  }
  
  // Calculate growth rate using linear regression
  const n = memoryHistory.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = memoryHistory[i].heapUsed;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const timeSpan = (memoryHistory[n - 1].timestamp - memoryHistory[0].timestamp) / 1000 / 60; // minutes
  
  // Growth rate in MB per minute
  const growthRate = (slope * n / timeSpan) / (1024 * 1024);
  
  // Suspect leak if growing > 1MB per minute consistently
  const suspected = growthRate > 1;
  
  let recommendation = 'Memory usage appears stable.';
  if (suspected) {
    if (growthRate > 10) {
      recommendation = 'CRITICAL: Severe memory leak detected. Immediate investigation required.';
    } else if (growthRate > 5) {
      recommendation = 'WARNING: Significant memory growth. Check for event listener leaks and unclosed connections.';
    } else {
      recommendation = 'Minor memory growth detected. Monitor and check for object retention.';
    }
  }
  
  return {
    suspected,
    growthRate: Math.round(growthRate * 100) / 100,
    samples: [...memoryHistory],
    recommendation,
  };
}

/**
 * Format memory size for display.
 */
export function formatMemorySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * Generate memory report.
 */
export function generateMemoryReport(): string {
  const current = getMemoryStats();
  const leak = analyzeMemoryLeak();
  
  if (!current) {
    return 'Memory profiling not available (browser environment)';
  }
  
  return `
# Memory Profiling Report

## Current Usage
- **Heap Used**: ${formatMemorySize(current.heapUsed)}
- **Heap Total**: ${formatMemorySize(current.heapTotal)}
- **RSS**: ${formatMemorySize(current.rss)}
- **External**: ${formatMemorySize(current.external)}

## Leak Analysis
- **Suspected Leak**: ${leak.suspected ? '⚠️ YES' : '✅ NO'}
- **Growth Rate**: ${leak.growthRate} MB/min
- **Samples Collected**: ${leak.samples.length}
- **Recommendation**: ${leak.recommendation}

## Heap Usage Over Time
${leak.samples.slice(-10).map((s, i) => 
  `${i + 1}. ${formatMemorySize(s.heapUsed)} @ ${new Date(s.timestamp).toISOString()}`
).join('\n')}
`.trim();
}

/**
 * Start memory monitoring.
 */
let monitorInterval: ReturnType<typeof setInterval> | null = null;

export function startMemoryMonitoring(intervalMs: number = 60000): void {
  if (monitorInterval) return;
  
  monitorInterval = setInterval(() => {
    recordMemorySample();
    
    const leak = analyzeMemoryLeak();
    if (leak.suspected && leak.growthRate > 5) {
      console.warn('[Memory] Potential leak detected:', leak.recommendation);
    }
  }, intervalMs);
  
  // Initial sample
  recordMemorySample();
}

/**
 * Stop memory monitoring.
 */
export function stopMemoryMonitoring(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}

/**
 * Clear memory history.
 */
export function clearMemoryHistory(): void {
  memoryHistory.length = 0;
}

/**
 * Force garbage collection (requires --expose-gc flag).
 */
export function forceGC(): boolean {
  if (typeof global !== 'undefined' && (global as { gc?: () => void }).gc) {
    (global as { gc: () => void }).gc();
    return true;
  }
  return false;
}
