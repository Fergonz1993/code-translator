// ===== TRANSLATION SKELETON =====
// Loading skeleton for translations panel.

import { Skeleton } from "@/components/ui/Skeleton";

interface TranslationSkeletonProps {
  lines?: number;
}

export function TranslationSkeleton({ lines = 5 }: TranslationSkeletonProps) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {/* Line number */}
          <Skeleton variant="text" width={24} className="flex-shrink-0" />
          
          {/* Content */}
          <div className="flex-1 space-y-2">
            {/* Code line */}
            <Skeleton 
              variant="text" 
              width={`${60 + Math.random() * 30}%`} 
            />
            {/* Translation */}
            <Skeleton 
              variant="text" 
              width={`${70 + Math.random() * 25}%`} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}
