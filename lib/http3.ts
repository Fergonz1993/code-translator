// ===== HTTP/3 AND QUIC SUPPORT =====
// Configuration for HTTP/3 and QUIC protocol support.

/**
 * HTTP/3 feature detection.
 */
export function supportsHTTP3(): boolean {
  // HTTP/3 support is server-side configuration
  // This checks if the client likely supports it
  if (typeof navigator === 'undefined') return false;
  
  // Modern browsers with QUIC support
  const ua = navigator.userAgent;
  const isChrome = /Chrome\/(\d+)/.test(ua);
  const isFirefox = /Firefox\/(\d+)/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  
  if (isChrome) {
    const version = parseInt(ua.match(/Chrome\/(\d+)/)?.[1] || '0', 10);
    return version >= 87; // Chrome 87+ has HTTP/3 enabled by default
  }
  
  if (isFirefox) {
    const version = parseInt(ua.match(/Firefox\/(\d+)/)?.[1] || '0', 10);
    return version >= 88; // Firefox 88+ has experimental HTTP/3
  }
  
  if (isSafari) {
    // Safari 14+ has HTTP/3 support
    return /Version\/1[4-9]/.test(ua) || /Version\/[2-9]\d/.test(ua);
  }
  
  return false;
}

/**
 * Alt-Svc header for HTTP/3.
 */
export function getAltSvcHeader(port: number = 443): string {
  return `h3=":${port}"; ma=86400, h3-29=":${port}"; ma=86400`;
}

/**
 * HTTP/3 server configuration hints.
 */
export const http3Config = {
  // Maximum number of concurrent streams
  maxConcurrentStreams: 100,
  
  // Initial congestion window (packets)
  initialCongestionWindow: 10,
  
  // Connection idle timeout (ms)
  idleTimeout: 30000,
  
  // Enable 0-RTT (faster subsequent connections)
  enable0RTT: true,
  
  // Maximum datagram frame size
  maxDatagramSize: 1350,
};

/**
 * QUIC transport parameters.
 */
export const quicTransportParams = {
  // Max stream data bidirectional local
  maxStreamDataBidiLocal: 1048576, // 1MB
  
  // Max stream data bidirectional remote
  maxStreamDataBidiRemote: 1048576, // 1MB
  
  // Max stream data unidirectional
  maxStreamDataUni: 1048576, // 1MB
  
  // Max data (connection level)
  maxData: 15728640, // 15MB
  
  // Active connection ID limit
  activeConnectionIdLimit: 2,
};

/**
 * Connection coalescing hints for HTTP/3.
 */
export const connectionHints = {
  // Hint browser to use same connection for these origins
  coalesceOrigins: [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
  ],
  
  // DNS prefetch hints
  dnsPrefetch: [
    'api.openai.com',
    'generativelanguage.googleapis.com',
    'api.anthropic.com',
  ],
  
  // Preconnect hints
  preconnect: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ],
};

/**
 * Generate connection hint headers.
 */
export function generateConnectionHints(): string[] {
  const hints: string[] = [];
  
  for (const origin of connectionHints.preconnect) {
    hints.push(`<${origin}>; rel=preconnect`);
  }
  
  for (const domain of connectionHints.dnsPrefetch) {
    hints.push(`<${domain}>; rel=dns-prefetch`);
  }
  
  return hints;
}

/**
 * Vercel/Cloudflare HTTP/3 configuration.
 */
export const cdnHTTP3Config = {
  vercel: {
    // Vercel automatically enables HTTP/3
    enabled: true,
    altSvc: true,
  },
  cloudflare: {
    // Cloudflare settings
    http3: 'on',
    quic: 'on',
    '0rtt': 'on',
  },
};
