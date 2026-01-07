// ===== ROOT LAYOUT =====
// This is the main layout that wraps ALL pages in the app.
// It sets up the HTML structure, fonts, and metadata.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/Toast";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

// ===== FONT SETUP =====
// Using Inter - a clean, modern font that's easy to read
const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Show fallback font immediately, swap when loaded
});

// ===== PAGE METADATA =====
// This appears in the browser tab and in search results
export const metadata: Metadata = {
  title: "Code Translator | Code → English",
  description: "Translate code into plain English, line by line. Like Google Translate for programming.",
  keywords: ["code translator", "code to english", "programming", "learn to code"],
};

// ===== THE LAYOUT COMPONENT =====
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = headers().get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <ToastProvider>
            {/* The actual page content goes here */}
            {children}
          </ToastProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
