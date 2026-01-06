// ===== FONT PRELOADING =====
// Preload fonts to reduce CLS (Cumulative Layout Shift).

/**
 * Font configuration for the application.
 */
export const FONTS = {
  primary: {
    family: 'Inter',
    weights: ['400', '500', '600', '700'],
    display: 'swap' as const,
  },
  mono: {
    family: 'JetBrains Mono',
    weights: ['400', '500'],
    display: 'swap' as const,
  },
};

/**
 * Generate font preload link elements.
 */
export function generateFontPreloadLinks(): string[] {
  const links: string[] = [];
  
  // Google Fonts preconnect
  links.push('<link rel="preconnect" href="https://fonts.googleapis.com">');
  links.push('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
  
  // Font stylesheet
  const interWeights = FONTS.primary.weights.join(';');
  const monoWeights = FONTS.mono.weights.join(';');
  
  links.push(
    `<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@${interWeights}&family=JetBrains+Mono:wght@${monoWeights}&display=swap">`
  );
  
  return links;
}

/**
 * Font-face declarations for local hosting.
 */
export function generateFontFaceCSS(): string {
  return `
/* Inter Variable Font */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/fonts/Inter-Variable.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* JetBrains Mono */
@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/fonts/JetBrainsMono-Regular.woff2') format('woff2');
}

@font-face {
  font-family: 'JetBrains Mono';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('/fonts/JetBrainsMono-Medium.woff2') format('woff2');
}
`.trim();
}

/**
 * CSS to prevent layout shift from fonts.
 */
export function generateFontFallbackCSS(): string {
  return `
/* Font fallback sizing adjustments */
@font-face {
  font-family: 'Inter-fallback';
  size-adjust: 107%;
  ascent-override: 90%;
  src: local('Arial');
}

@font-face {
  font-family: 'JetBrains Mono-fallback';
  size-adjust: 105%;
  ascent-override: 95%;
  src: local('Courier New');
}

/* Apply fallback fonts */
:root {
  --font-sans: 'Inter', 'Inter-fallback', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'JetBrains Mono-fallback', 'Courier New', monospace;
}
`.trim();
}

/**
 * Check if fonts are loaded.
 */
export async function fontsLoaded(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  
  try {
    await document.fonts.ready;
    return document.fonts.check('1rem Inter') && document.fonts.check('1rem JetBrains Mono');
  } catch {
    return false;
  }
}

/**
 * Hook to track font loading status.
 */
export function useFontsLoaded(): boolean {
  if (typeof window === 'undefined') return false;
  
  const [loaded, setLoaded] = React.useState(false);
  
  React.useEffect(() => {
    fontsLoaded().then(setLoaded);
  }, []);
  
  return loaded;
}

import React from 'react';
