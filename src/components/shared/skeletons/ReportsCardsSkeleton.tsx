import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

export const ReportsCardsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 select-none">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5 space-y-3">
          <SkeletonBlock className="h-4 w-28 rounded mb-3" />
          <div className="space-y-2">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="flex justify-between py-1.5 border-b border-dashed border-gyment-border/40">
                <SkeletonBlock className="h-3 w-20 rounded" />
                <SkeletonBlock className="h-3.5 w-12 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
