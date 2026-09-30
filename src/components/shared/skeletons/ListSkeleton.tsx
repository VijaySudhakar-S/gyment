import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

interface ListSkeletonProps {
  count?: number;
  className?: string;
  hasAvatar?: boolean;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 4,
  className = '',
  hasAvatar = true,
}) => {
  return (
    <div className={`divide-y divide-gyment-border select-none ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="px-4 py-3.5 flex gap-3.5 items-start">
          {hasAvatar && (
            <SkeletonBlock className="w-9 h-9 rounded-lg shrink-0" />
          )}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <SkeletonBlock className="h-3.5 w-32 sm:w-44 rounded" />
              <SkeletonBlock className="h-2.5 w-12 rounded" />
            </div>
            <SkeletonBlock className="h-3 w-4/5 rounded" />
            <SkeletonBlock className="h-2.5 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
