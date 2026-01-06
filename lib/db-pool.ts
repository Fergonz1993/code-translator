// ===== DATABASE CONNECTION POOLING =====
// Connection pool management for SQLite.

import Database from 'better-sqlite3';

export interface PoolConfig {
  maxConnections: number;
  idleTimeoutMs: number;
  acquireTimeoutMs: number;
  dbPath: string;
}

interface PooledConnection {
  db: Database.Database;
  inUse: boolean;
  lastUsed: number;
  createdAt: number;
}

const DEFAULT_CONFIG: PoolConfig = {
  maxConnections: 5,
  idleTimeoutMs: 60000, // 1 minute
  acquireTimeoutMs: 5000, // 5 seconds
  dbPath: './data/credits.sqlite',
};

/**
 * SQLite connection pool for better-sqlite3.
 */
export class ConnectionPool {
  private connections: PooledConnection[] = [];
  private config: PoolConfig;
  private waiting: Array<{
    resolve: (conn: PooledConnection) => void;
    reject: (err: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = [];
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  
  constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();
  }
  
  /**
   * Create a new connection.
   */
  private createConnection(): PooledConnection {
    const db = new Database(this.config.dbPath);
    
    // Configure SQLite for safety and performance
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.pragma(`busy_timeout = ${process.env.SQLITE_BUSY_TIMEOUT_MS || 2500}`);
    
    return {
      db,
      inUse: false,
      lastUsed: Date.now(),
      createdAt: Date.now(),
    };
  }
  
  /**
   * Acquire a connection from the pool.
   */
  async acquire(): Promise<PooledConnection> {
    // Try to find an available connection
    for (const conn of this.connections) {
      if (!conn.inUse) {
        conn.inUse = true;
        conn.lastUsed = Date.now();
        return conn;
      }
    }
    
    // Create new connection if under limit
    if (this.connections.length < this.config.maxConnections) {
      const conn = this.createConnection();
      conn.inUse = true;
      this.connections.push(conn);
      return conn;
    }
    
    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waiting.findIndex(w => w.resolve === resolve);
        if (index !== -1) {
          this.waiting.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeoutMs);
      
      this.waiting.push({ resolve, reject, timeout });
    });
  }
  
  /**
   * Release a connection back to the pool.
   */
  release(conn: PooledConnection): void {
    conn.inUse = false;
    conn.lastUsed = Date.now();
    
    // Check if anyone is waiting
    if (this.waiting.length > 0) {
      const waiter = this.waiting.shift()!;
      clearTimeout(waiter.timeout);
      conn.inUse = true;
      waiter.resolve(conn);
    }
  }
  
  /**
   * Execute a query using a pooled connection.
   */
  async query<T>(fn: (db: Database.Database) => T): Promise<T> {
    const conn = await this.acquire();
    try {
      return fn(conn.db);
    } finally {
      this.release(conn);
    }
  }
  
  /**
   * Execute a transaction using a pooled connection.
   */
  async transaction<T>(fn: (db: Database.Database) => T): Promise<T> {
    const conn = await this.acquire();
    try {
      return conn.db.transaction(() => fn(conn.db))();
    } finally {
      this.release(conn);
    }
  }
  
  /**
   * Start cleanup interval.
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.idleTimeoutMs / 2);
  }
  
  /**
   * Cleanup idle connections.
   */
  private cleanup(): void {
    const now = Date.now();
    const keepConnections: PooledConnection[] = [];
    
    for (const conn of this.connections) {
      if (conn.inUse) {
        keepConnections.push(conn);
        continue;
      }
      
      const idleTime = now - conn.lastUsed;
      if (idleTime < this.config.idleTimeoutMs || keepConnections.length < 1) {
        // Keep at least one connection
        keepConnections.push(conn);
      } else {
        // Close idle connection
        conn.db.close();
      }
    }
    
    this.connections = keepConnections;
  }
  
  /**
   * Close all connections.
   */
  close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    for (const conn of this.connections) {
      conn.db.close();
    }
    this.connections = [];
    
    // Reject all waiting
    for (const waiter of this.waiting) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Pool closed'));
    }
    this.waiting = [];
  }
  
  /**
   * Get pool statistics.
   */
  getStats(): {
    total: number;
    inUse: number;
    available: number;
    waiting: number;
  } {
    const inUse = this.connections.filter(c => c.inUse).length;
    
    return {
      total: this.connections.length,
      inUse,
      available: this.connections.length - inUse,
      waiting: this.waiting.length,
    };
  }
}

// Singleton pool instance
let poolInstance: ConnectionPool | null = null;

export function getPool(config?: Partial<PoolConfig>): ConnectionPool {
  if (!poolInstance) {
    poolInstance = new ConnectionPool(config);
  }
  return poolInstance;
}

export function closePool(): void {
  if (poolInstance) {
    poolInstance.close();
    poolInstance = null;
  }
}
