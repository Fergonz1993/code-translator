'use client';

// ===== CODE FOLDING SYNC =====
// Sync code folding with explanation visibility.

import React, { createContext, useContext, useState, useCallback } from 'react';

interface FoldRange {
  startLine: number;
  endLine: number;
  folded: boolean;
}

interface FoldingContextType {
  foldedRanges: FoldRange[];
  toggleFold: (startLine: number, endLine: number) => void;
  isFolded: (line: number) => boolean;
  isHidden: (line: number) => boolean;
  foldAll: () => void;
  unfoldAll: () => void;
  setFoldableRanges: (ranges: Omit<FoldRange, 'folded'>[]) => void;
}

const FoldingContext = createContext<FoldingContextType | null>(null);

/**
 * Provider for code folding state sync between editor and explanations.
 */
export function FoldingProvider({ children }: { children: React.ReactNode }) {
  const [foldedRanges, setFoldedRanges] = useState<FoldRange[]>([]);
  
  const toggleFold = useCallback((startLine: number, endLine: number) => {
    setFoldedRanges(prev => {
      const existing = prev.find(r => r.startLine === startLine && r.endLine === endLine);
      if (existing) {
        return prev.map(r => 
          r.startLine === startLine && r.endLine === endLine
            ? { ...r, folded: !r.folded }
            : r
        );
      }
      return [...prev, { startLine, endLine, folded: true }];
    });
  }, []);
  
  const isFolded = useCallback((line: number) => {
    return foldedRanges.some(r => r.startLine === line && r.folded);
  }, [foldedRanges]);
  
  const isHidden = useCallback((line: number) => {
    return foldedRanges.some(r => r.folded && line > r.startLine && line <= r.endLine);
  }, [foldedRanges]);
  
  const foldAll = useCallback(() => {
    setFoldedRanges(prev => prev.map(r => ({ ...r, folded: true })));
  }, []);
  
  const unfoldAll = useCallback(() => {
    setFoldedRanges(prev => prev.map(r => ({ ...r, folded: false })));
  }, []);
  
  const setFoldableRanges = useCallback((ranges: Omit<FoldRange, 'folded'>[]) => {
    setFoldedRanges(ranges.map(r => ({ ...r, folded: false })));
  }, []);
  
  return (
    <FoldingContext.Provider value={{
      foldedRanges,
      toggleFold,
      isFolded,
      isHidden,
      foldAll,
      unfoldAll,
      setFoldableRanges,
    }}>
      {children}
    </FoldingContext.Provider>
  );
}

/**
 * Hook to use folding context.
 */
export function useFolding() {
  const context = useContext(FoldingContext);
  if (!context) {
    throw new Error('useFolding must be used within FoldingProvider');
  }
  return context;
}

/**
 * Fold indicator button.
 */
export function FoldIndicator({
  line,
  endLine,
  className = '',
}: {
  line: number;
  endLine: number;
  className?: string;
}) {
  const { isFolded, toggleFold } = useFolding();
  const folded = isFolded(line);
  
  return (
    <button
      onClick={() => toggleFold(line, endLine)}
      className={`w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-300 ${className}`}
      title={folded ? 'Expand' : 'Collapse'}
    >
      <svg
        className={`w-3 h-3 transition-transform ${folded ? '' : 'rotate-90'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

/**
 * Foldable line wrapper.
 */
export function FoldableLine({
  line,
  children,
  className = '',
}: {
  line: number;
  children: React.ReactNode;
  className?: string;
}) {
  const { isHidden } = useFolding();
  
  if (isHidden(line)) {
    return null;
  }
  
  return <div className={className}>{children}</div>;
}

/**
 * Folding controls (fold/unfold all).
 */
export function FoldingControls({ className = '' }: { className?: string }) {
  const { foldAll, unfoldAll } = useFolding();
  
  return (
    <div className={`flex gap-2 ${className}`}>
      <button
        onClick={foldAll}
        className="text-xs text-gray-500 hover:text-gray-300"
      >
        Fold All
      </button>
      <button
        onClick={unfoldAll}
        className="text-xs text-gray-500 hover:text-gray-300"
      >
        Unfold All
      </button>
    </div>
  );
}

/**
 * Detect foldable regions in code.
 */
export function detectFoldableRanges(code: string): Omit<FoldRange, 'folded'>[] {
  const lines = code.split('\n');
  const ranges: Omit<FoldRange, 'folded'>[] = [];
  const stack: number[] = [];
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Detect block starts
    if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
      stack.push(lineNum);
    }
    
    // Detect block ends
    if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
      const startLine = stack.pop();
      if (startLine !== undefined && lineNum - startLine > 1) {
        ranges.push({ startLine, endLine: lineNum });
      }
    }
  });
  
  return ranges;
}

export default FoldingProvider;
