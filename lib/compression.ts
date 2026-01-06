// ===== COMPRESSION CONFIG =====
// Brotli and gzip compression configuration.

/**
 * Compression settings for Next.js.
 */
export const compressionConfig = {
  // Enable compression
  compress: true,
  
  // Brotli quality (0-11, higher = better compression but slower)
  brotliQuality: 6,
  
  // Gzip level (1-9, higher = better compression but slower)
  gzipLevel: 6,
  
  // Minimum size to compress (bytes)
  threshold: 1024, // 1KB
  
  // MIME types to compress
  compressibleTypes: [
    'text/html',
    'text/css',
    'text/javascript',
    'text/plain',
    'text/xml',
    'application/javascript',
    'application/json',
    'application/xml',
    'application/x-javascript',
    'image/svg+xml',
  ],
};

/**
 * Check if content type is compressible.
 */
export function isCompressible(contentType: string): boolean {
  const baseType = contentType.split(';')[0].trim().toLowerCase();
  return compressionConfig.compressibleTypes.includes(baseType);
}

/**
 * Get preferred encoding from Accept-Encoding header.
 */
export function getPreferredEncoding(
  acceptEncoding: string
): 'br' | 'gzip' | 'identity' {
  if (acceptEncoding.includes('br')) return 'br';
  if (acceptEncoding.includes('gzip')) return 'gzip';
  return 'identity';
}

/**
 * Next.js config additions for compression.
 */
export const nextCompressionConfig = {
  compress: true,
  experimental: {
    // Enable Brotli compression in Next.js 14+
  },
  headers: async () => [
    {
      source: '/:path*.js',
      headers: [
        { key: 'Content-Encoding', value: 'gzip' },
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/:path*.css',
      headers: [
        { key: 'Content-Encoding', value: 'gzip' },
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],
};

/**
 * Estimate compression savings.
 */
export function estimateCompressionRatio(
  contentType: string,
  size: number
): { gzip: number; brotli: number } {
  // Average compression ratios by content type
  const ratios: Record<string, { gzip: number; brotli: number }> = {
    'text/html': { gzip: 0.15, brotli: 0.12 },
    'text/css': { gzip: 0.12, brotli: 0.10 },
    'application/javascript': { gzip: 0.20, brotli: 0.15 },
    'application/json': { gzip: 0.10, brotli: 0.08 },
    'image/svg+xml': { gzip: 0.30, brotli: 0.25 },
  };
  
  const baseType = contentType.split(';')[0].trim().toLowerCase();
  const ratio = ratios[baseType] || { gzip: 0.25, brotli: 0.20 };
  
  return {
    gzip: Math.round(size * ratio.gzip),
    brotli: Math.round(size * ratio.brotli),
  };
}
