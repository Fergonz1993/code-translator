// ===== WEB WORKERS =====
// Web Workers for CPU-intensive tasks.

/**
 * Worker message types.
 */
export interface WorkerMessage<T = unknown> {
  id: string;
  type: 'request' | 'response' | 'error' | 'progress';
  action: string;
  payload: T;
  progress?: number;
}

/**
 * Create a worker from a function.
 */
export function createWorkerFromFunction(fn: (...args: unknown[]) => unknown): Worker {
  const blob = new Blob([`
    self.onmessage = function(e) {
      const { id, action, payload } = e.data;
      try {
        const fn = ${fn.toString()};
        const result = fn(payload);
        self.postMessage({ id, type: 'response', action, payload: result });
      } catch (error) {
        self.postMessage({ id, type: 'error', action, payload: error.message });
      }
    };
  `], { type: 'application/javascript' });
  
  return new Worker(URL.createObjectURL(blob));
}

/**
 * Worker pool for parallel processing.
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    message: WorkerMessage;
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
  }> = [];
  private busy: Set<Worker> = new Set();
  
  constructor(
    private workerUrl: string | (() => Worker),
    private size: number = navigator.hardwareConcurrency || 4
  ) {
    this.initWorkers();
  }
  
  private initWorkers(): void {
    for (let i = 0; i < this.size; i++) {
      const worker = typeof this.workerUrl === 'string'
        ? new Worker(this.workerUrl)
        : this.workerUrl();
      
      worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        this.busy.delete(worker);
        this.processQueue();
      };
      
      this.workers.push(worker);
    }
  }
  
  /**
   * Execute task on worker pool.
   */
  execute<T, R>(action: string, payload: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const message: WorkerMessage<T> = {
        id: crypto.randomUUID(),
        type: 'request',
        action,
        payload,
      };
      
      this.queue.push({
        message,
        resolve: resolve as (result: unknown) => void,
        reject,
      });
      
      this.processQueue();
    });
  }
  
  private processQueue(): void {
    if (this.queue.length === 0) return;
    
    const availableWorker = this.workers.find(w => !this.busy.has(w));
    if (!availableWorker) return;
    
    const task = this.queue.shift()!;
    this.busy.add(availableWorker);
    
    const handler = (e: MessageEvent<WorkerMessage>) => {
      if (e.data.id !== task.message.id) return;
      
      availableWorker.removeEventListener('message', handler);
      
      if (e.data.type === 'error') {
        task.reject(new Error(e.data.payload as string));
      } else {
        task.resolve(e.data.payload);
      }
    };
    
    availableWorker.addEventListener('message', handler);
    availableWorker.postMessage(task.message);
  }
  
  /**
   * Terminate all workers.
   */
  terminate(): void {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.queue = [];
    this.busy.clear();
  }
}

/**
 * Offload function to worker.
 */
export function offloadToWorker<T, R>(
  fn: (payload: T) => R
): (payload: T) => Promise<R> {
  const worker = createWorkerFromFunction(fn as unknown as (...args: unknown[]) => unknown);
  
  return (payload: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      
      const handler = (e: MessageEvent<WorkerMessage<R>>) => {
        if (e.data.id !== id) return;
        
        worker.removeEventListener('message', handler);
        
        if (e.data.type === 'error') {
          reject(new Error(e.data.payload as unknown as string));
        } else {
          resolve(e.data.payload);
        }
      };
      
      worker.addEventListener('message', handler);
      worker.postMessage({ id, type: 'request', action: 'execute', payload });
    });
  };
}

/**
 * Code analysis worker functions.
 */
export const workerTasks = {
  // Syntax highlighting (CPU intensive for large files)
  highlightCode: (code: string) => {
    // Would implement syntax highlighting logic
    return code;
  },
  
  // Code complexity analysis
  analyzeComplexity: (code: string) => {
    const lines = code.split('\n').length;
    const chars = code.length;
    return { lines, chars, complexity: lines * 0.1 };
  },
  
  // Large text search
  searchText: (args: { text: string; query: string }) => {
    const matches: number[] = [];
    let index = 0;
    while ((index = args.text.indexOf(args.query, index)) !== -1) {
      matches.push(index);
      index++;
    }
    return matches;
  },
};

/**
 * Transfer objects efficiently (Transferable).
 */
export function transferArrayBuffer(
  worker: Worker,
  message: WorkerMessage,
  buffers: ArrayBuffer[]
): void {
  worker.postMessage(message, buffers);
}
