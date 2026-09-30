import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

interface FormSkeletonProps {
  fields?: number;
  className?: string;
  columns?: 1 | 2;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fields = 4,
  className = '',
  columns = 2,
}) => {
  return (
    <div className={`space-y-5 select-none ${className}`}>
      <div className={`grid grid-cols-1 ${columns === 2 ? 'sm:grid-cols-2' : ''} gap-4`}>
        {[...Array(fields)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <SkeletonBlock className="h-3.5 w-24 rounded" />
            <SkeletonBlock className="h-9.5 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="pt-2 flex justify-end">
        <SkeletonBlock className="h-9.5 w-32 rounded-lg" />
      </div>
    </div>
  );
};
