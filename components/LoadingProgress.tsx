'use client';

// ===== ANIMATED LOADING PROGRESS =====
// Animated loading states with progress indicators.

import React, { useState, useEffect } from 'react';

interface LoadingProgressProps {
  isLoading: boolean;
  progress?: number; // 0-100
  message?: string;
  className?: string;
}

/**
 * Animated progress bar.
 */
export function ProgressBar({
  progress,
  className = '',
  animated = true,
}: {
  progress: number;
  className?: string;
  animated?: boolean;
}) {
  return (
    <div className={`w-full h-1 bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ${
          animated ? 'animate-shimmer' : ''
        }`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  );
}

/**
 * Indeterminate loading bar.
 */
export function IndeterminateProgress({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-1 bg-gray-700 rounded-full overflow-hidden ${className}`}>
      <div className="h-full w-1/3 bg-gradient-to-r from-blue-500 to-purple-500 animate-indeterminate" />
    </div>
  );
}

/**
 * Circular progress indicator.
 */
export function CircularProgress({
  progress,
  size = 48,
  strokeWidth = 4,
  className = '',
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg
      width={size}
      height={size}
      className={`transform -rotate-90 ${className}`}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-700"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progress-gradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-300"
      />
      <defs>
        <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Loading spinner with optional text.
 */
export function LoadingSpinner({
  size = 'md',
  message,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className={`${sizes[size]} border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin`} />
      {message && <span className="text-sm text-gray-400">{message}</span>}
    </div>
  );
}

/**
 * Translation loading progress component.
 */
export function TranslationProgress({
  isLoading,
  progress = 0,
  message = 'Translating...',
  className = '',
}: LoadingProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  
  // Smooth progress animation
  useEffect(() => {
    if (isLoading && progress > displayProgress) {
      const timer = setTimeout(() => {
        setDisplayProgress(prev => Math.min(progress, prev + 2));
      }, 20);
      return () => clearTimeout(timer);
    } else if (!isLoading) {
      setDisplayProgress(0);
    }
  }, [isLoading, progress, displayProgress]);
  
  if (!isLoading) return null;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{message}</span>
        <span className="text-gray-500">{Math.round(displayProgress)}%</span>
      </div>
      <ProgressBar progress={displayProgress} />
    </div>
  );
}

/**
 * Skeleton pulse animation for loading states.
 */
export function Skeleton({
  width,
  height,
  className = '',
  rounded = true,
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
}) {
  return (
    <div
      className={`bg-gray-700 animate-pulse ${rounded ? 'rounded' : ''} ${className}`}
      style={{ width, height }}
    />
  );
}

/**
 * Text skeleton with multiple lines.
 */
export function TextSkeleton({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={16}
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
}

/**
 * CSS for custom animations.
 */
export const loadingStyles = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

.animate-shimmer {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.animate-indeterminate {
  animation: indeterminate 1.2s ease-in-out infinite;
}
`;

export default TranslationProgress;
