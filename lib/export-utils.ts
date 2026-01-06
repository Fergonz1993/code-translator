// ===== EXPORT UTILITIES =====
// Functions to download translations in different formats.

import { TranslatedLine } from "./types";

/**
 * Downloads a string as a file in the browser.
 * Like printing a physical document from a digital file.
 */
function downloadFile(content: string, fileName: string, contentType: string) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
}

/**
 * Exports to Plain Text (.txt)
 */
export function exportToTxt(code: string, translations: TranslatedLine[]) {
  let content = "CODE TRANSLATION REPORT\n";
  content += "=======================\n\n";
  
  translations.forEach((item) => {
    content += `Line ${item.lineNumber}: ${item.line}\n`;
    content += `Explanation: ${item.english}\n\n`;
  });

  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(content, `translation-${timestamp}.txt`, "text/plain");
}

/**
 * Exports to Markdown (.md)
 * Great for GitHub, Notion, or technical documentation.
 */
export function exportToMarkdown(code: string, language: string, translations: TranslatedLine[]) {
  let content = `# Code Translation: ${language.toUpperCase()}\n\n`;
  
  content += "## Original Code\n\n";
  content += "```" + language + "\n";
  content += code + "\n";
  content += "```\n\n";

  content += "## Line-by-Line Explanation\n\n";
  translations.forEach((item) => {
    content += `### Line ${item.lineNumber}\n`;
    content += `\`${item.line.trim()}\`\n\n`;
    content += `${item.english}\n\n`;
  });

  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(content, `translation-${timestamp}.md`, "text/markdown");
}

/**
 * Exports to JSON (.json)
 * For programmatic use or backup.
 */
export function exportToJson(code: string, language: string, model: string, translations: TranslatedLine[]) {
  const data = {
    metadata: {
      language,
      model,
      exportedAt: new Date().toISOString(),
    },
    code,
    translations,
  };

  const content = JSON.stringify(data, null, 2);
  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(content, `translation-${timestamp}.json`, "application/json");
}

/**
 * Generates a shareable URL containing the code and language.
 * Uses Base64 encoding to pack the data into the URL.
 */
export function generateShareUrl(code: string, language: string) {
  if (typeof window === "undefined") return "";

  try {
    // We use btoa for basic base64 encoding. 
    // For very long code, this might create long URLs, but it's the simplest "serverless" way.
    const encodedCode = btoa(unescape(encodeURIComponent(code)));
    const url = new URL(window.location.origin);
    url.searchParams.set("code", encodedCode);
    url.searchParams.set("lang", language);
    
    return url.toString();
  } catch (err) {
    console.error("Failed to generate share URL:", err);
    return window.location.origin;
  }
}
