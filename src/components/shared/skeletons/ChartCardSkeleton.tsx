import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

interface ChartCardSkeletonProps {
  height?: number;
  className?: string;
  type?: 'line' | 'bar' | 'donut';
}

export const ChartCardSkeleton: React.FC<ChartCardSkeletonProps> = ({
  height = 190,
  className = '',
  type = 'line',
}) => {
  return (
    <div className={`bg-white border border-gyment-border rounded-xl p-4 sm:p-5 select-none ${className}`}>
      {/* Title & subtitle placeholder */}
      <div className="flex justify-between items-baseline mb-4">
        <div className="space-y-1">
          <SkeletonBlock className="h-4 w-36 rounded" />
          <SkeletonBlock className="h-3 w-24 rounded" />
        </div>
        <SkeletonBlock className="h-3 w-16 rounded" />
      </div>

      {/* Chart silhouette body */}
      <div
        style={{ height }}
        className="w-full flex items-end justify-between gap-3 pt-6 pb-2 px-3 border border-dashed border-gyment-border/40 rounded-lg"
      >
        {type === 'donut' ? (
          <div className="w-full h-full flex items-center justify-around">
            <SkeletonBlock className="w-28 h-28 rounded-full" />
            <div className="space-y-2.5">
              <SkeletonBlock className="h-3 w-28 rounded" />
              <SkeletonBlock className="h-3 w-24 rounded" />
              <SkeletonBlock className="h-3 w-20 rounded" />
            </div>
          </div>
        ) : (
          [...Array(type === 'bar' ? 6 : 8)].map((_, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <SkeletonBlock
                className="w-full max-w-10 rounded-t"
                style={{ height: `${25 + ((idx * 37) % 65)}%` }}
              />
              <SkeletonBlock className="h-2 w-6 rounded" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
