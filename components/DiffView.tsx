'use client';

// ===== SIDE-BY-SIDE DIFF VIEW =====
// Display code changes in a diff view.

import React from 'react';

interface DiffLine {
  type: 'add' | 'remove' | 'unchanged';
  lineNumber: { old?: number; new?: number };
  content: string;
}

interface DiffViewProps {
  oldCode: string;
  newCode: string;
  oldTitle?: string;
  newTitle?: string;
  className?: string;
}

/**
 * Simple diff algorithm (LCS-based).
 */
export function computeDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  let oldIdx = 0;
  let newIdx = 0;
  let oldLineNum = 1;
  let newLineNum = 1;
  
  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];
    
    if (oldIdx >= oldLines.length) {
      // Only new lines left
      result.push({
        type: 'add',
        lineNumber: { new: newLineNum++ },
        content: newLine,
      });
      newIdx++;
    } else if (newIdx >= newLines.length) {
      // Only old lines left
      result.push({
        type: 'remove',
        lineNumber: { old: oldLineNum++ },
        content: oldLine,
      });
      oldIdx++;
    } else if (oldLine === newLine) {
      // Lines match
      result.push({
        type: 'unchanged',
        lineNumber: { old: oldLineNum++, new: newLineNum++ },
        content: oldLine,
      });
      oldIdx++;
      newIdx++;
    } else {
      // Check for insertion or deletion
      const newInOld = oldLines.indexOf(newLine, oldIdx);
      const oldInNew = newLines.indexOf(oldLine, newIdx);
      
      if (oldInNew === -1 || (newInOld !== -1 && newInOld - oldIdx < oldInNew - newIdx)) {
        // Remove old line
        result.push({
          type: 'remove',
          lineNumber: { old: oldLineNum++ },
          content: oldLine,
        });
        oldIdx++;
      } else {
        // Add new line
        result.push({
          type: 'add',
          lineNumber: { new: newLineNum++ },
          content: newLine,
        });
        newIdx++;
      }
    }
  }
  
  return result;
}

/**
 * Side-by-side diff view component.
 */
export function DiffView({
  oldCode,
  newCode,
  oldTitle = 'Original',
  newTitle = 'Modified',
  className = '',
}: DiffViewProps) {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  const diff = computeDiff(oldLines, newLines);
  
  // Separate into two columns
  const leftLines: DiffLine[] = [];
  const rightLines: DiffLine[] = [];
  
  for (const line of diff) {
    if (line.type === 'remove') {
      leftLines.push(line);
      rightLines.push({ type: 'unchanged', lineNumber: {}, content: '' });
    } else if (line.type === 'add') {
      leftLines.push({ type: 'unchanged', lineNumber: {}, content: '' });
      rightLines.push(line);
    } else {
      leftLines.push(line);
      rightLines.push(line);
    }
  }
  
  const lineClasses = {
    add: 'bg-green-900/30 border-l-2 border-green-500',
    remove: 'bg-red-900/30 border-l-2 border-red-500',
    unchanged: 'bg-transparent',
  };
  
  const textClasses = {
    add: 'text-green-400',
    remove: 'text-red-400',
    unchanged: 'text-gray-300',
  };
  
  return (
    <div className={`grid grid-cols-2 gap-0 rounded-lg overflow-hidden border border-gray-700 ${className}`}>
      {/* Headers */}
      <div className="bg-gray-800 p-2 border-b border-r border-gray-700 text-gray-400 text-sm font-medium">
        {oldTitle}
      </div>
      <div className="bg-gray-800 p-2 border-b border-gray-700 text-gray-400 text-sm font-medium">
        {newTitle}
      </div>
      
      {/* Left (old) */}
      <div className="font-mono text-sm border-r border-gray-700 overflow-x-auto">
        {leftLines.map((line, i) => (
          <div key={i} className={`flex px-2 py-0.5 ${lineClasses[line.type]}`}>
            <span className="w-8 text-gray-500 text-right pr-2 select-none">
              {line.lineNumber.old || ''}
            </span>
            <span className={textClasses[line.type]}>{line.content || ' '}</span>
          </div>
        ))}
      </div>
      
      {/* Right (new) */}
      <div className="font-mono text-sm overflow-x-auto">
        {rightLines.map((line, i) => (
          <div key={i} className={`flex px-2 py-0.5 ${lineClasses[line.type]}`}>
            <span className="w-8 text-gray-500 text-right pr-2 select-none">
              {line.lineNumber.new || ''}
            </span>
            <span className={textClasses[line.type]}>{line.content || ' '}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Unified diff view (single column).
 */
export function UnifiedDiffView({
  oldCode,
  newCode,
  className = '',
}: Omit<DiffViewProps, 'oldTitle' | 'newTitle'>) {
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  const diff = computeDiff(oldLines, newLines);
  
  const lineClasses = {
    add: 'bg-green-900/30',
    remove: 'bg-red-900/30',
    unchanged: '',
  };
  
  const prefixClasses = {
    add: 'text-green-400',
    remove: 'text-red-400',
    unchanged: 'text-gray-500',
  };
  
  const prefixes = {
    add: '+',
    remove: '-',
    unchanged: ' ',
  };
  
  return (
    <div className={`font-mono text-sm rounded-lg overflow-hidden border border-gray-700 ${className}`}>
      {diff.map((line, i) => (
        <div key={i} className={`flex px-2 py-0.5 ${lineClasses[line.type]}`}>
          <span className={`w-4 ${prefixClasses[line.type]}`}>
            {prefixes[line.type]}
          </span>
          <span className="text-gray-300">{line.content}</span>
        </div>
      ))}
    </div>
  );
}

export default DiffView;
