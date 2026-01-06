'use client';

// ===== EMPTY STATE ILLUSTRATIONS =====
// Illustrations for empty states.

import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'code' | 'history' | 'search' | 'error';
}

const illustrations = {
  code: (
    <svg className="w-32 h-32 text-gray-600" viewBox="0 0 128 128" fill="none">
      <rect x="20" y="30" width="88" height="68" rx="4" stroke="currentColor" strokeWidth="2" />
      <line x1="30" y1="50" x2="60" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="62" x2="80" y2="62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="74" x2="50" y2="74" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="90" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M92 82 L108 98" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  history: (
    <svg className="w-32 h-32 text-gray-600" viewBox="0 0 128 128" fill="none">
      <circle cx="64" cy="64" r="40" stroke="currentColor" strokeWidth="2" />
      <line x1="64" y1="64" x2="64" y2="40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="64" y1="64" x2="80" y2="64" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg className="w-32 h-32 text-gray-600" viewBox="0 0 128 128" fill="none">
      <circle cx="56" cy="56" r="30" stroke="currentColor" strokeWidth="2" />
      <line x1="78" y1="78" x2="105" y2="105" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg className="w-32 h-32 text-red-500" viewBox="0 0 128 128" fill="none">
      <circle cx="64" cy="64" r="40" stroke="currentColor" strokeWidth="2" />
      <line x1="48" y1="48" x2="80" y2="80" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="48" x2="48" y2="80" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

export function EmptyState({ title, description, action, variant = 'code' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {illustrations[variant]}
      <h3 className="mt-6 text-lg font-medium text-gray-300">{title}</h3>
      {description && <p className="mt-2 text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
