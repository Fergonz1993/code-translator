// ===== IMAGE OPTIMIZATION CONFIG =====
// Next.js image optimization configuration.

import { ImageLoader } from 'next/image';

/**
 * Custom image loader for CDN.
 */
export const cdnLoader: ImageLoader = ({ src, width, quality }) => {
  const q = quality || 75;
  // Use Vercel's image optimization by default
  if (src.startsWith('/')) {
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${q}`;
  }
  // For external images, pass through
  return src;
};

/**
 * Image optimization configuration.
 */
export const imageConfig = {
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  formats: ['image/webp', 'image/avif'] as const,
  minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  dangerouslyAllowSVG: true,
  contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
};

/**
 * Generate blur placeholder data URL.
 */
export function generateBlurPlaceholder(
  width: number = 8,
  height: number = 8
): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1f2937"/>
    </svg>
  `.trim();
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Common image sizes for responsive design.
 */
export const RESPONSIVE_SIZES = {
  thumbnail: { width: 64, height: 64 },
  small: { width: 256, height: 256 },
  medium: { width: 512, height: 512 },
  large: { width: 1024, height: 1024 },
  full: { width: 1920, height: 1080 },
};

/**
 * Generate srcset attribute for responsive images.
 */
export function generateSrcSet(
  src: string,
  widths: number[] = [320, 640, 1024, 1920]
): string {
  return widths
    .map(w => `${src}?w=${w} ${w}w`)
    .join(', ');
}

/**
 * Image props helper for common patterns.
 */
export function getImageProps(
  src: string,
  alt: string,
  priority: boolean = false
) {
  return {
    src,
    alt,
    priority,
    placeholder: 'blur' as const,
    blurDataURL: generateBlurPlaceholder(),
    loading: priority ? undefined : ('lazy' as const),
  };
}
