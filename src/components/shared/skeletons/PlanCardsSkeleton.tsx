import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

export const PlanCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 select-none">
      {[...Array(count)].map((_, idx) => (
        <div
          key={idx}
          className="border border-gyment-border rounded-xl p-5 bg-white flex flex-col justify-between h-72 shadow-xs"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="h-5 w-24 rounded" />
              <SkeletonBlock className="h-4 w-12 rounded-full" />
            </div>
            <SkeletonBlock className="h-8 w-32 rounded" />
            <div className="space-y-2 pt-2">
              <SkeletonBlock className="h-3 w-4/5 rounded" />
              <SkeletonBlock className="h-3 w-3/4 rounded" />
              <SkeletonBlock className="h-3 w-2/3 rounded" />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <SkeletonBlock className="h-9 flex-1 rounded-lg" />
            <SkeletonBlock className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
};
