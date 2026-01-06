// ===== CORS POLICY =====
// Hardened CORS configuration.

export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

const DEFAULT_CONFIG: CORSConfig = {
  allowedOrigins: [],
  allowedMethods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  exposedHeaders: ['X-Request-Id', 'X-API-Version'],
  maxAge: 86400, // 24 hours
  credentials: true,
};

/**
 * Get allowed origins from environment.
 */
export function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  
  // Add APP_URL if set
  if (process.env.APP_URL) {
    origins.push(process.env.APP_URL);
  }
  
  // Add additional origins from ALLOWED_ORIGINS
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()));
  }
  
  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://127.0.0.1:3000');
  }
  
  return origins;
}

/**
 * Check if origin is allowed.
 */
export function isOriginAllowed(origin: string | null, config?: Partial<CORSConfig>): boolean {
  if (!origin) return false;
  
  const allowedOrigins = config?.allowedOrigins ?? getAllowedOrigins();
  
  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // Check wildcard patterns
  for (const allowed of allowedOrigins) {
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      const originUrl = new URL(origin);
      if (originUrl.hostname.endsWith(domain)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Generate CORS headers for a response.
 */
export function getCORSHeaders(
  origin: string | null,
  config: Partial<CORSConfig> = {}
): Record<string, string> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const headers: Record<string, string> = {};
  
  // Only set Access-Control-Allow-Origin if origin is allowed
  if (origin && isOriginAllowed(origin, fullConfig)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  
  if (fullConfig.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  headers['Access-Control-Allow-Methods'] = fullConfig.allowedMethods.join(', ');
  headers['Access-Control-Allow-Headers'] = fullConfig.allowedHeaders.join(', ');
  
  if (fullConfig.exposedHeaders.length > 0) {
    headers['Access-Control-Expose-Headers'] = fullConfig.exposedHeaders.join(', ');
  }
  
  headers['Access-Control-Max-Age'] = fullConfig.maxAge.toString();
  
  return headers;
}

/**
 * Handle preflight OPTIONS request.
 */
export function handlePreflight(
  request: Request,
  config: Partial<CORSConfig> = {}
): Response {
  const origin = request.headers.get('Origin');
  const headers = getCORSHeaders(origin, config);
  
  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Add CORS headers to an existing response.
 */
export function addCORSHeaders(
  response: Response,
  request: Request,
  config: Partial<CORSConfig> = {}
): Response {
  const origin = request.headers.get('Origin');
  const corsHeaders = getCORSHeaders(origin, config);
  
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * CORS middleware wrapper.
 */
export function withCORS(
  handler: (request: Request) => Promise<Response>,
  config: Partial<CORSConfig> = {}
) {
  return async (request: Request): Promise<Response> => {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return handlePreflight(request, config);
    }
    
    // Check origin
    const origin = request.headers.get('Origin');
    if (origin && !isOriginAllowed(origin, config)) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Call handler and add CORS headers
    const response = await handler(request);
    return addCORSHeaders(response, request, config);
  };
}
