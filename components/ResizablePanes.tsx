'use client';

// ===== RESIZABLE PANES =====
// Drag-to-resize split panes.

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ResizablePanesProps {
  children: [React.ReactNode, React.ReactNode];
  direction?: 'horizontal' | 'vertical';
  defaultSplit?: number;
  minSize?: number;
  maxSize?: number;
  onResize?: (split: number) => void;
  className?: string;
}

/**
 * Resizable split pane component.
 */
export function ResizablePanes({
  children,
  direction = 'horizontal',
  defaultSplit = 50,
  minSize = 20,
  maxSize = 80,
  onResize,
  className = '',
}: ResizablePanesProps) {
  const [split, setSplit] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current.getBoundingClientRect();
    let newSplit: number;
    
    if (direction === 'horizontal') {
      newSplit = ((e.clientX - container.left) / container.width) * 100;
    } else {
      newSplit = ((e.clientY - container.top) / container.height) * 100;
    }
    
    // Clamp to min/max
    newSplit = Math.max(minSize, Math.min(maxSize, newSplit));
    
    setSplit(newSplit);
    onResize?.(newSplit);
  }, [isDragging, direction, minSize, maxSize, onResize]);
  
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, direction]);
  
  const flexDirection = direction === 'horizontal' ? 'flex-row' : 'flex-col';
  const cursorClass = direction === 'horizontal' ? 'cursor-col-resize' : 'cursor-row-resize';
  const dividerSize = direction === 'horizontal' ? 'w-1 h-full' : 'h-1 w-full';
  
  return (
    <div
      ref={containerRef}
      className={`flex ${flexDirection} ${className}`}
    >
      {/* First pane */}
      <div
        style={{ [direction === 'horizontal' ? 'width' : 'height']: `${split}%` }}
        className="overflow-hidden"
      >
        {children[0]}
      </div>
      
      {/* Divider */}
      <div
        onMouseDown={handleMouseDown}
        className={`${dividerSize} ${cursorClass} bg-gray-700 hover:bg-blue-500 transition-colors flex-shrink-0 group relative`}
      >
        {/* Drag handle visual */}
        <div className={`absolute inset-0 flex items-center justify-center ${
          direction === 'horizontal' ? 'flex-col' : 'flex-row'
        }`}>
          <div className="w-1 h-6 bg-gray-600 rounded group-hover:bg-blue-400 transition-colors" />
        </div>
        
        {/* Larger hit area */}
        <div className={`absolute ${
          direction === 'horizontal' 
            ? '-left-2 -right-2 inset-y-0' 
            : '-top-2 -bottom-2 inset-x-0'
        }`} />
      </div>
      
      {/* Second pane */}
      <div
        style={{ [direction === 'horizontal' ? 'width' : 'height']: `${100 - split}%` }}
        className="overflow-hidden"
      >
        {children[1]}
      </div>
    </div>
  );
}

/**
 * Touch-friendly resize handle hook.
 */
export function useResizeHandle(
  direction: 'horizontal' | 'vertical',
  onResize: (delta: number) => void
) {
  const [isResizing, setIsResizing] = useState(false);
  const startPos = useRef(0);
  
  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    setIsResizing(true);
    if ('touches' in e) {
      startPos.current = direction === 'horizontal' 
        ? e.touches[0].clientX 
        : e.touches[0].clientY;
    } else {
      startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    }
  }, [direction]);
  
  useEffect(() => {
    if (!isResizing) return;
    
    const handleMove = (e: TouchEvent | MouseEvent) => {
      let currentPos: number;
      if ('touches' in e) {
        currentPos = direction === 'horizontal' 
          ? e.touches[0].clientX 
          : e.touches[0].clientY;
      } else {
        currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      }
      
      const delta = currentPos - startPos.current;
      startPos.current = currentPos;
      onResize(delta);
    };
    
    const handleEnd = () => setIsResizing(false);
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isResizing, direction, onResize]);
  
  return {
    isResizing,
    handlers: {
      onMouseDown: handleStart,
      onTouchStart: handleStart,
    },
  };
}

export default ResizablePanes;
