import type { Config } from "tailwindcss";

// ===== TAILWIND CONFIGURATION =====
// This file tells Tailwind which files to scan for class names
// and any custom theme extensions we want to add.

const config: Config = {
  // Where Tailwind should look for class names to include in the final CSS
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",       // All files in the app directory
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // All files in components
  ],
  theme: {
    extend: {
      // We can add custom colors, fonts, etc. here later if needed
    },
  },
  plugins: [],
};

export default config;
