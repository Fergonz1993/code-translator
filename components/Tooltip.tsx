'use client';

// ===== EXPLANATION TOOLTIP =====
// Hover tooltip for code explanations.

import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ content, children, position = 'top', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  
  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          x: rect.left + rect.width / 2,
          y: position === 'bottom' ? rect.bottom : rect.top,
        });
      }
      setIsVisible(true);
    }, delay);
  };
  
  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  const positionClasses = {
    top: 'bottom-full mb-2 -translate-x-1/2',
    bottom: 'top-full mt-2 -translate-x-1/2',
    left: 'right-full mr-2 -translate-y-1/2',
    right: 'left-full ml-2 -translate-y-1/2',
  };
  
  return (
    <div
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      className="relative inline-block"
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm bg-gray-800 text-white rounded-lg shadow-lg max-w-xs ${positionClasses[position]}`}
          style={{ left: '50%' }}
        >
          {content}
          <div className={`absolute w-2 h-2 bg-gray-800 transform rotate-45 ${
            position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
            position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''
          }`} />
        </div>
      )}
    </div>
  );
}

// Explanation-specific tooltip with longer content
export function ExplanationTooltip({ line, explanation }: { line: number; explanation: string }) {
  return (
    <Tooltip content={<div className="max-w-sm">{explanation}</div>} position="right" delay={300}>
      <span className="cursor-help text-gray-500 hover:text-gray-300 px-1">
        Line {line}
      </span>
    </Tooltip>
  );
}

export default Tooltip;
