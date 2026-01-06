// ===== WEBSOCKET STREAMING =====
// WebSocket support for real-time streaming translations.

export interface WSMessage {
  type: 'start' | 'chunk' | 'complete' | 'error' | 'ping' | 'pong';
  requestId?: string;
  data?: unknown;
  timestamp: number;
}

export interface StreamingTranslation {
  line: number;
  partial: string;
  complete: boolean;
}

/**
 * WebSocket connection manager for streaming translations.
 */
export class TranslationWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<string, Set<(msg: WSMessage) => void>> = new Map();
  
  constructor(url?: string) {
    this.url = url || this.getWebSocketUrl();
  }
  
  private getWebSocketUrl(): string {
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    return `${protocol}//${host}/api/ws`;
  }
  
  /**
   * Connect to WebSocket server.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }
      
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.startPingInterval();
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WSMessage;
            this.handleMessage(message);
          } catch {
            console.error('[WS] Failed to parse message');
          }
        };
        
        this.ws.onclose = () => {
          this.stopPingInterval();
          this.handleReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from WebSocket server.
   */
  disconnect(): void {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
  
  /**
   * Send a message through WebSocket.
   */
  send(message: Omit<WSMessage, 'timestamp'>): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Not connected');
      return;
    }
    
    this.ws.send(JSON.stringify({
      ...message,
      timestamp: Date.now(),
    }));
  }
  
  /**
   * Subscribe to messages for a specific request.
   */
  subscribe(requestId: string, callback: (msg: WSMessage) => void): () => void {
    if (!this.listeners.has(requestId)) {
      this.listeners.set(requestId, new Set());
    }
    this.listeners.get(requestId)!.add(callback);
    
    return () => {
      this.listeners.get(requestId)?.delete(callback);
    };
  }
  
  /**
   * Handle incoming messages.
   */
  private handleMessage(message: WSMessage): void {
    if (message.type === 'pong') {
      return; // Heartbeat response
    }
    
    // Notify specific request listeners
    if (message.requestId) {
      const callbacks = this.listeners.get(message.requestId);
      callbacks?.forEach(cb => cb(message));
    }
    
    // Notify global listeners
    const globalCallbacks = this.listeners.get('*');
    globalCallbacks?.forEach(cb => cb(message));
  }
  
  /**
   * Start ping interval for keep-alive.
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }
  
  /**
   * Stop ping interval.
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  /**
   * Handle reconnection with exponential backoff.
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnect attempts reached');
      return;
    }
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will retry
      });
    }, delay);
  }
  
  /**
   * Check if connected.
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsInstance: TranslationWebSocket | null = null;

export function getWebSocket(): TranslationWebSocket {
  if (!wsInstance) {
    wsInstance = new TranslationWebSocket();
  }
  return wsInstance;
}

/**
 * Stream translation using WebSocket.
 */
export async function streamTranslation(
  code: string,
  model: string,
  language: string,
  onChunk: (chunk: StreamingTranslation) => void
): Promise<void> {
  const ws = getWebSocket();
  
  if (!ws.isConnected) {
    await ws.connect();
  }
  
  const requestId = crypto.randomUUID();
  
  return new Promise((resolve, reject) => {
    const unsubscribe = ws.subscribe(requestId, (message) => {
      switch (message.type) {
        case 'chunk':
          onChunk(message.data as StreamingTranslation);
          break;
        case 'complete':
          unsubscribe();
          resolve();
          break;
        case 'error':
          unsubscribe();
          reject(new Error(message.data as string));
          break;
      }
    });
    
    ws.send({
      type: 'start',
      requestId,
      data: { code, model, language },
    });
  });
}
