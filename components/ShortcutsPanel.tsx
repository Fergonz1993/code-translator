'use client';

// ===== KEYBOARD SHORTCUTS PANEL =====
// Display keyboard shortcuts help panel.

import React, { useState, useEffect } from 'react';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['⌘', 'K'], description: 'Open command palette', category: 'General' },
  { keys: ['⌘', 'Enter'], description: 'Translate code', category: 'Translation' },
  { keys: ['⌘', 'S'], description: 'Save to history', category: 'History' },
  { keys: ['⌘', ','], description: 'Open settings', category: 'General' },
  { keys: ['⌘', '/'], description: 'Show shortcuts', category: 'General' },
  { keys: ['Esc'], description: 'Close modal/panel', category: 'General' },
  { keys: ['⌘', 'C'], description: 'Copy selected code', category: 'Editor' },
  { keys: ['⌘', 'V'], description: 'Paste code', category: 'Editor' },
  { keys: ['⌘', 'Z'], description: 'Undo', category: 'Editor' },
  { keys: ['⌘', 'Shift', 'Z'], description: 'Redo', category: 'Editor' },
  { keys: ['⌘', 'F'], description: 'Find in code', category: 'Editor' },
  { keys: ['⌘', 'L'], description: 'Select line', category: 'Editor' },
];

export function ShortcutsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [filter, setFilter] = useState('');
  
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const categories = [...new Set(SHORTCUTS.map(s => s.category))];
  const filtered = SHORTCUTS.filter(s => 
    s.description.toLowerCase().includes(filter.toLowerCase())
  );
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        
        <input
          type="text"
          placeholder="Search shortcuts..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded text-white"
          autoFocus
        />
        
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {categories.map(category => {
            const items = filtered.filter(s => s.category === category);
            if (items.length === 0) return null;
            
            return (
              <div key={category}>
                <h3 className="text-sm font-medium text-gray-400 mb-2">{category}</h3>
                <div className="space-y-1">
                  {items.map((shortcut, i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="text-gray-300">{shortcut.description}</span>
                      <div className="flex gap-1">
                        {shortcut.keys.map((key, j) => (
                          <kbd key={j} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 border border-gray-600">
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ShortcutsPanel;
