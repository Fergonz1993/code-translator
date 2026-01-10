'use client';

// ===== COLLAPSIBLE SECTIONS =====
// Collapsible sections for long explanations.

import React, { useState, useRef, useEffect } from 'react';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

/**
 * Collapsible section component with smooth animation.
 */
export function Collapsible({
  title,
  children,
  defaultOpen = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(
    defaultOpen ? undefined : 0
  );
  
  useEffect(() => {
    if (isOpen) {
      const height = contentRef.current?.scrollHeight;
      setContentHeight(height);
      // After animation, set to auto for dynamic content
      const timer = setTimeout(() => setContentHeight(undefined), 300);
      return () => clearTimeout(timer);
    } else {
      // First set explicit height for animation
      setContentHeight(contentRef.current?.scrollHeight);
      requestAnimationFrame(() => {
        setContentHeight(0);
      });
    }
  }, [isOpen]);
  
  return (
    <div className={`border border-gray-700 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-750 transition-colors text-left ${headerClassName}`}
      >
        <span className="font-medium text-gray-200">{title}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        ref={contentRef}
        style={{ height: contentHeight !== undefined ? `${contentHeight}px` : 'auto' }}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${contentClassName}`}
      >
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}

interface CollapsibleGroupProps {
  children: React.ReactNode;
  accordion?: boolean;
  className?: string;
}

/**
 * Group of collapsible sections (optionally accordion mode).
 */
export function CollapsibleGroup({
  children,
  accordion = false,
  className = '',
}: CollapsibleGroupProps) {
  const [_openIndex, _setOpenIndex] = useState<number | null>(null);
  
  if (!accordion) {
    return <div className={`space-y-2 ${className}`}>{children}</div>;
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<CollapsibleProps>, {
            defaultOpen: _openIndex === index,
            // Note: For full accordion behavior, we'd wire onClick to _setOpenIndex
          });
        }
        return child;
      })}
    </div>
  );
}

/**
 * Simple text truncation with "show more".
 */
export function TruncatedText({
  text,
  maxLength = 150,
  className = '',
}: {
  text: string;
  maxLength?: number;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (text.length <= maxLength) {
    return <span className={className}>{text}</span>;
  }
  
  return (
    <span className={className}>
      {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="ml-1 text-blue-400 hover:text-blue-300 text-sm"
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>
    </span>
  );
}

/**
 * Collapsible code block.
 */
export function CollapsibleCode({
  code,
  title = 'Code',
  maxLines = 10,
  defaultOpen = false,
}: {
  code: string;
  title?: string;
  maxLines?: number;
  defaultOpen?: boolean;
}) {
  const lines = code.split('\n');
  const shouldCollapse = lines.length > maxLines;
  
  if (!shouldCollapse) {
    return (
      <pre className="p-3 bg-gray-900 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    );
  }
  
  return (
    <Collapsible
      title={`${title} (${lines.length} lines)`}
      defaultOpen={defaultOpen}
    >
      <pre className="p-3 bg-gray-900 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </Collapsible>
  );
}

export default Collapsible;
