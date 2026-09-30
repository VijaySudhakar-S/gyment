import React from 'react';
import { SkeletonBlock } from './SkeletonBase';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  className = '',
  showHeader = true,
}) => {
  return (
    <div className={`w-full overflow-hidden select-none ${className}`}>
      {showHeader && (
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gyment-border bg-gyment-bg/30">
          {[...Array(columns)].map((_, i) => (
            <div
              key={i}
              className={`flex-1 ${i === 0 ? 'min-w-32' : ''} ${i === columns - 1 ? 'max-w-20 text-right' : ''}`}
            >
              <SkeletonBlock className="h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      )}

      <div className="divide-y divide-gyment-border/40">
        {[...Array(rows)].map((_, rIdx) => (
          <div key={rIdx} className="flex items-center gap-4 px-4 py-3.5">
            {[...Array(columns)].map((_, cIdx) => (
              <div
                key={cIdx}
                className={`flex-1 ${cIdx === 0 ? 'min-w-32 flex items-center gap-2.5' : ''} ${cIdx === columns - 1 ? 'max-w-20 flex justify-end' : ''}`}
              >
                {cIdx === 0 && (
                  <SkeletonBlock className="w-7 h-7 rounded-full shrink-0" />
                )}
                <SkeletonBlock
                  className={`h-3.5 rounded ${cIdx === 0 ? 'w-28' : cIdx === columns - 1 ? 'w-12 h-6 rounded-md' : 'w-20'}`}
                  style={{ width: cIdx > 0 && cIdx < columns - 1 ? `${40 + ((rIdx * 17 + cIdx * 23) % 45)}%` : undefined }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
