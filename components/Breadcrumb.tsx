'use client';

// ===== BREADCRUMB NAVIGATION =====
// Breadcrumb navigation for nested routes.

import React from 'react';
import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
}

export function Breadcrumb({ items, separator, className = '' }: BreadcrumbProps) {
  const defaultSeparator = (
    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
  
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">{separator || defaultSeparator}</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-200 text-sm font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Generate breadcrumbs from path
export function pathToBreadcrumbs(path: string): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
  
  segments.forEach((segment, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    
    items.push({
      label,
      href: i === segments.length - 1 ? undefined : href,
    });
  });
  
  return items;
}

export default Breadcrumb;
