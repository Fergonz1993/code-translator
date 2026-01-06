'use client';

// ===== SYNTAX HIGHLIGHTED EXPLANATIONS =====
// Render code explanations with syntax highlighting.

import React, { useMemo } from 'react';

/**
 * Token types for syntax highlighting explanations.
 */
type TokenType = 
  | 'keyword'
  | 'function'
  | 'variable'
  | 'string'
  | 'number'
  | 'operator'
  | 'type'
  | 'comment'
  | 'punctuation'
  | 'text';

interface Token {
  type: TokenType;
  content: string;
}

/**
 * Token colors for dark theme.
 */
const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: 'text-purple-400',
  function: 'text-blue-400',
  variable: 'text-cyan-400',
  string: 'text-green-400',
  number: 'text-orange-400',
  operator: 'text-yellow-300',
  type: 'text-emerald-400',
  comment: 'text-gray-500',
  punctuation: 'text-gray-400',
  text: 'text-gray-200',
};

/**
 * Patterns to detect code-like elements in explanations.
 */
const CODE_PATTERNS: Array<{ pattern: RegExp; type: TokenType }> = [
  // Function calls
  { pattern: /\b([a-zA-Z_]\w*)\s*\(/g, type: 'function' },
  // Variable names (camelCase, snake_case)
  { pattern: /\b([a-z][a-zA-Z0-9]*(?:_[a-zA-Z0-9]+)*)\b/g, type: 'variable' },
  // Types (PascalCase)
  { pattern: /\b([A-Z][a-zA-Z0-9]+)\b/g, type: 'type' },
  // Numbers
  { pattern: /\b(\d+(?:\.\d+)?)\b/g, type: 'number' },
  // Strings in quotes
  { pattern: /"[^"]*"|'[^']*'|`[^`]*`/g, type: 'string' },
  // Operators
  { pattern: /[=+\-*/<>!&|]+/g, type: 'operator' },
  // Keywords
  { pattern: /\b(if|else|for|while|return|const|let|var|function|class|import|export|async|await|try|catch|throw|new|this|null|undefined|true|false)\b/g, type: 'keyword' },
];

/**
 * Tokenize explanation text for syntax highlighting.
 */
export function tokenizeExplanation(text: string): Token[] {
  const tokens: Token[] = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    let matched = false;
    
    for (const { pattern, type } of CODE_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(remaining);
      
      if (match && match.index === 0) {
        tokens.push({ type, content: match[0] });
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      // Find next match or consume rest as text
      let nextMatchIndex = remaining.length;
      
      for (const { pattern } of CODE_PATTERNS) {
        pattern.lastIndex = 0;
        const match = pattern.exec(remaining);
        if (match && match.index < nextMatchIndex) {
          nextMatchIndex = match.index;
        }
      }
      
      if (nextMatchIndex > 0) {
        tokens.push({ type: 'text', content: remaining.slice(0, nextMatchIndex) });
        remaining = remaining.slice(nextMatchIndex);
      }
    }
  }
  
  return tokens;
}

/**
 * Syntax highlighted explanation component.
 */
export function SyntaxExplanation({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const tokens = useMemo(() => tokenizeExplanation(text), [text]);
  
  return (
    <span className={className}>
      {tokens.map((token, i) => (
        <span key={i} className={TOKEN_COLORS[token.type]}>
          {token.content}
        </span>
      ))}
    </span>
  );
}

/**
 * Inline code component for explanations.
 */
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 bg-gray-800 rounded text-sm font-mono text-cyan-400">
      {children}
    </code>
  );
}

/**
 * Code block in explanations.
 */
export function ExplanationCodeBlock({
  code,
  language = 'typescript',
}: {
  code: string;
  language?: string;
}) {
  return (
    <pre className="p-3 bg-gray-900 rounded-lg overflow-x-auto">
      <code className="text-sm font-mono">
        <SyntaxExplanation text={code} />
      </code>
    </pre>
  );
}

export default SyntaxExplanation;
