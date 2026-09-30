import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

interface StatCardSkeletonProps {
  count?: number;
  className?: string;
}

export const StatCardSkeleton: React.FC<StatCardSkeletonProps> = ({ count = 1, className = '' }) => {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`bg-white border border-gyment-border rounded-xl px-4 py-3.5 space-y-2 select-none ${className}`}
        >
          <SkeletonBlock className="h-3.5 w-24 rounded" />
          <SkeletonBlock className="h-7 w-28 rounded mt-1.5" />
          <SkeletonBlock className="h-3 w-20 rounded mt-1" />
        </div>
      ))}
    </>
  );
};
