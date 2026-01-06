// ===== IDLE CALLBACK UTILITIES =====
// requestIdleCallback for non-critical work.

type IdleCallbackHandle = number;

interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining: () => number;
}

type IdleCallback = (deadline: IdleDeadline) => void;

/**
 * RequestIdleCallback polyfill.
 */
export const requestIdleCallback: (
  callback: IdleCallback,
  options?: { timeout?: number }
) => IdleCallbackHandle = 
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? window.requestIdleCallback.bind(window)
    : (cb: IdleCallback, options?: { timeout?: number }) => {
        const start = Date.now();
        return window.setTimeout(() => {
          cb({
            didTimeout: options?.timeout ? Date.now() - start >= options.timeout : false,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
          });
        }, 1) as unknown as IdleCallbackHandle;
      };

/**
 * CancelIdleCallback polyfill.
 */
export const cancelIdleCallback: (handle: IdleCallbackHandle) => void =
  typeof window !== 'undefined' && 'cancelIdleCallback' in window
    ? window.cancelIdleCallback.bind(window)
    : (handle: IdleCallbackHandle) => clearTimeout(handle);

/**
 * Queue of deferred tasks.
 */
interface DeferredTask {
  id: string;
  fn: () => void | Promise<void>;
  priority: number;
  timeout?: number;
}

const taskQueue: DeferredTask[] = [];
let isProcessing = false;

/**
 * Schedule work during idle time.
 */
export function scheduleIdleWork(
  fn: () => void | Promise<void>,
  options: { priority?: number; timeout?: number } = {}
): string {
  const id = crypto.randomUUID();
  
  taskQueue.push({
    id,
    fn,
    priority: options.priority || 0,
    timeout: options.timeout,
  });
  
  // Sort by priority (higher first)
  taskQueue.sort((a, b) => b.priority - a.priority);
  
  if (!isProcessing) {
    processIdleQueue();
  }
  
  return id;
}

/**
 * Process idle queue.
 */
function processIdleQueue(): void {
  if (taskQueue.length === 0) {
    isProcessing = false;
    return;
  }
  
  isProcessing = true;
  
  requestIdleCallback(
    async (deadline) => {
      while (taskQueue.length > 0 && deadline.timeRemaining() > 0) {
        const task = taskQueue.shift()!;
        try {
          await task.fn();
        } catch (error) {
          console.error('[IdleCallback] Task failed:', error);
        }
      }
      
      // Continue processing if more tasks
      if (taskQueue.length > 0) {
        processIdleQueue();
      } else {
        isProcessing = false;
      }
    },
    { timeout: 5000 }
  );
}

/**
 * Cancel scheduled idle work.
 */
export function cancelIdleWork(id: string): boolean {
  const index = taskQueue.findIndex(t => t.id === id);
  if (index !== -1) {
    taskQueue.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Run function when browser is idle.
 */
export function runWhenIdle<T>(fn: () => T, timeout?: number): Promise<T> {
  return new Promise((resolve, reject) => {
    requestIdleCallback(
      () => {
        try {
          resolve(fn());
        } catch (error) {
          reject(error);
        }
      },
      timeout ? { timeout } : undefined
    );
  });
}

/**
 * Defer non-critical initialization.
 */
export function deferInit(initFn: () => void, label?: string): void {
  scheduleIdleWork(() => {
    if (label) {
      console.log(`[Deferred Init] ${label}`);
    }
    initFn();
  }, { priority: -1 });
}

/**
 * Batch updates for idle processing.
 */
export class IdleBatcher<T> {
  private items: T[] = [];
  private scheduled = false;
  
  constructor(
    private processFn: (items: T[]) => void,
    private batchSize: number = 10
  ) {}
  
  add(item: T): void {
    this.items.push(item);
    
    if (!this.scheduled) {
      this.scheduled = true;
      scheduleIdleWork(() => this.flush());
    }
  }
  
  flush(): void {
    while (this.items.length > 0) {
      const batch = this.items.splice(0, this.batchSize);
      this.processFn(batch);
    }
    this.scheduled = false;
  }
}

/**
 * Interruptible loop for large iterations.
 */
export async function interruptibleForEach<T>(
  items: T[],
  fn: (item: T, index: number) => void,
  chunkSize: number = 100
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    chunk.forEach((item, idx) => fn(item, i + idx));
    
    // Yield to main thread between chunks
    await runWhenIdle(() => {});
  }
}
