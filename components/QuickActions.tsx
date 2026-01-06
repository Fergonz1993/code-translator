'use client';

// ===== QUICK ACTIONS TOOLBAR =====
// Floating toolbar with quick actions.

import React from 'react';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  position?: 'top' | 'bottom';
  className?: string;
}

export function QuickActions({ actions, position = 'bottom', className = '' }: QuickActionsProps) {
  return (
    <div className={`fixed ${position === 'bottom' ? 'bottom-4' : 'top-20'} left-1/2 -translate-x-1/2 z-40 ${className}`}>
      <div className="flex items-center gap-1 bg-gray-800/95 backdrop-blur rounded-full px-2 py-1 shadow-xl border border-gray-700">
        {actions.map((action, i) => (
          <React.Fragment key={action.id}>
            <button
              onClick={action.onClick}
              disabled={action.disabled}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
              title={action.label}
            >
              {action.icon}
              <span className="sr-only">{action.label}</span>
            </button>
            {i < actions.length - 1 && <div className="w-px h-6 bg-gray-700" />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Common action icons
export const ActionIcons = {
  translate: (
    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  ),
  copy: (
    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  save: (
    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  ),
  clear: (
    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
};

export default QuickActions;
