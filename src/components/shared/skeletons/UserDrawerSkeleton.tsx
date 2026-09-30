import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

export const UserDrawerSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 select-none p-1">
      {/* User Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-gyment-border/40">
        <SkeletonBlock className="w-12 h-12 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-5 w-36 rounded" />
          <SkeletonBlock className="h-3 w-24 rounded" />
        </div>
      </div>

      {/* Account Info Rows */}
      <div className="space-y-3">
        <SkeletonBlock className="h-3.5 w-28 rounded uppercase" />
        <div className="space-y-3 pt-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-dashed border-gyment-border/40">
              <SkeletonBlock className="h-3 w-20 rounded" />
              <SkeletonBlock className="h-3.5 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 flex gap-2.5">
        <SkeletonBlock className="h-9 flex-1 rounded-lg" />
        <SkeletonBlock className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
};
