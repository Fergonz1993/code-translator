// ===== TRANSLATION QUEUE =====
// Queue system for batch processing translations.

export interface QueuedTranslation {
  id: string;
  code: string;
  model: string;
  language: string;
  priority: number;
  addedAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
  retries: number;
}

export interface QueueConfig {
  maxConcurrent: number;
  maxRetries: number;
  retryDelayMs: number;
  maxQueueSize: number;
}

const DEFAULT_CONFIG: QueueConfig = {
  maxConcurrent: 3,
  maxRetries: 2,
  retryDelayMs: 1000,
  maxQueueSize: 100,
};

type ProcessorFn = (item: QueuedTranslation) => Promise<unknown>;
type ProgressCallback = (item: QueuedTranslation) => void;

/**
 * Translation queue for batch processing.
 */
export class TranslationQueue {
  private queue: QueuedTranslation[] = [];
  private processing: Set<string> = new Set();
  private config: QueueConfig;
  private processor: ProcessorFn | null = null;
  private onProgress: ProgressCallback | null = null;
  private isRunning = false;
  
  constructor(config: Partial<QueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Set the processor function.
   */
  setProcessor(fn: ProcessorFn): void {
    this.processor = fn;
  }
  
  /**
   * Set progress callback.
   */
  setProgressCallback(fn: ProgressCallback): void {
    this.onProgress = fn;
  }
  
  /**
   * Add item to queue.
   */
  add(item: Omit<QueuedTranslation, 'id' | 'addedAt' | 'status' | 'retries'>): string {
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('Queue is full');
    }
    
    const queueItem: QueuedTranslation = {
      ...item,
      id: crypto.randomUUID(),
      addedAt: Date.now(),
      status: 'pending',
      retries: 0,
    };
    
    // Insert by priority (higher priority first)
    const insertIndex = this.queue.findIndex(q => q.priority < item.priority);
    if (insertIndex === -1) {
      this.queue.push(queueItem);
    } else {
      this.queue.splice(insertIndex, 0, queueItem);
    }
    
    // Start processing if not already running
    if (!this.isRunning) {
      this.start();
    }
    
    return queueItem.id;
  }
  
  /**
   * Add multiple items to queue.
   */
  addBatch(items: Array<Omit<QueuedTranslation, 'id' | 'addedAt' | 'status' | 'retries'>>): string[] {
    return items.map(item => this.add(item));
  }
  
  /**
   * Start processing queue.
   */
  start(): void {
    if (this.isRunning || !this.processor) return;
    this.isRunning = true;
    this.processNext();
  }
  
  /**
   * Stop processing queue.
   */
  stop(): void {
    this.isRunning = false;
  }
  
  /**
   * Process next items in queue.
   */
  private async processNext(): Promise<void> {
    if (!this.isRunning || !this.processor) return;
    
    // Get pending items up to concurrency limit
    const availableSlots = this.config.maxConcurrent - this.processing.size;
    const pendingItems = this.queue
      .filter(q => q.status === 'pending')
      .slice(0, availableSlots);
    
    if (pendingItems.length === 0 && this.processing.size === 0) {
      this.isRunning = false;
      return;
    }
    
    // Process each available item
    for (const item of pendingItems) {
      this.processItem(item);
    }
  }
  
  /**
   * Process a single item.
   */
  private async processItem(item: QueuedTranslation): Promise<void> {
    item.status = 'processing';
    this.processing.add(item.id);
    this.onProgress?.(item);
    
    try {
      const result = await this.processor!(item);
      item.status = 'completed';
      item.result = result;
    } catch (error) {
      item.retries++;
      
      if (item.retries < this.config.maxRetries) {
        // Retry after delay
        item.status = 'pending';
        setTimeout(() => this.processNext(), this.config.retryDelayMs);
      } else {
        item.status = 'failed';
        item.error = error instanceof Error ? error.message : 'Unknown error';
      }
    } finally {
      this.processing.delete(item.id);
      this.onProgress?.(item);
      
      // Process more items
      setTimeout(() => this.processNext(), 0);
    }
  }
  
  /**
   * Get item by ID.
   */
  get(id: string): QueuedTranslation | undefined {
    return this.queue.find(q => q.id === id);
  }
  
  /**
   * Remove item from queue.
   */
  remove(id: string): boolean {
    const index = this.queue.findIndex(q => q.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Clear all items from queue.
   */
  clear(): void {
    this.queue = [];
    this.processing.clear();
  }
  
  /**
   * Get queue statistics.
   */
  getStats(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  } {
    return {
      pending: this.queue.filter(q => q.status === 'pending').length,
      processing: this.processing.size,
      completed: this.queue.filter(q => q.status === 'completed').length,
      failed: this.queue.filter(q => q.status === 'failed').length,
      total: this.queue.length,
    };
  }
  
  /**
   * Get all items in queue.
   */
  getAll(): QueuedTranslation[] {
    return [...this.queue];
  }
  
  /**
   * Wait for all items to complete.
   */
  async waitForAll(): Promise<QueuedTranslation[]> {
    return new Promise((resolve) => {
      const checkComplete = () => {
        const stats = this.getStats();
        if (stats.pending === 0 && stats.processing === 0) {
          resolve(this.getAll());
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      checkComplete();
    });
  }
}

// Singleton instance
export const translationQueue = new TranslationQueue();
