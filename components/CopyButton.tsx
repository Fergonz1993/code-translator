'use client';

// ===== COPY BUTTON FEEDBACK =====
// Animated copy button with success feedback.

import React, { useState, useCallback } from 'react';

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'text' | 'both';
}

export function CopyButton({ text, className = '', size = 'md', variant = 'icon' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);
  
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  const CopyIcon = () => (
    <svg className={sizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
  
  const CheckIcon = () => (
    <svg className={`${sizes[size]} text-green-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
  
  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors ${className}`}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      <span className="relative">
        <span className={`transition-opacity duration-200 ${copied ? 'opacity-0' : 'opacity-100'}`}>
          <CopyIcon />
        </span>
        <span className={`absolute inset-0 transition-opacity duration-200 ${copied ? 'opacity-100' : 'opacity-0'}`}>
          <CheckIcon />
        </span>
      </span>
      {(variant === 'text' || variant === 'both') && (
        <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
      )}
    </button>
  );
}

// Pre-styled copy button for code blocks
export function CodeCopyButton({ code }: { code: string }) {
  return (
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <CopyButton 
        text={code} 
        size="sm" 
        className="p-1.5 bg-gray-700 rounded hover:bg-gray-600"
      />
    </div>
  );
}

export default CopyButton;
