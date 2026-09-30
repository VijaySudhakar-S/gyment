import React from 'react';
import { SkeletonBlock } from './SkeletonBase';
import { StatCardSkeleton } from './StatCardSkeleton';
import { TableSkeleton } from './TableSkeleton';

export const GymDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-5 select-none">
      {/* Header Profile Card Skeleton */}
      <div className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5 flex justify-between items-start flex-wrap gap-4">
        <div className="flex items-center gap-3.5">
          <SkeletonBlock className="w-14 h-14 rounded-full shrink-0" />
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <SkeletonBlock className="h-6 w-48 rounded" />
              <SkeletonBlock className="h-5 w-16 rounded-full" />
            </div>
            <SkeletonBlock className="h-3.5 w-36 rounded" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-9 w-24 rounded-lg" />
          <SkeletonBlock className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* KPI Row Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCardSkeleton count={4} />
      </div>

      {/* Subscription & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active Subscription Card */}
        <div className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gyment-border/40">
            <SkeletonBlock className="h-4 w-32 rounded" />
            <SkeletonBlock className="h-4 w-16 rounded" />
          </div>
          <div className="space-y-3">
            <SkeletonBlock className="h-8 w-28 rounded" />
            <SkeletonBlock className="h-3.5 w-40 rounded" />
            <div className="space-y-2 pt-2">
              <SkeletonBlock className="h-3 w-full rounded" />
              <SkeletonBlock className="h-3 w-5/6 rounded" />
              <SkeletonBlock className="h-3 w-3/4 rounded" />
            </div>
          </div>
        </div>

        {/* Staff / Admins Table */}
        <div className="lg:col-span-2 bg-white border border-gyment-border rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3.5 border-b border-gyment-border flex justify-between items-center">
            <SkeletonBlock className="h-4 w-36 rounded" />
            <SkeletonBlock className="h-7 w-20 rounded" />
          </div>
          <TableSkeleton rows={3} columns={4} showHeader={false} />
        </div>
      </div>

      {/* Subscription History Table Card */}
      <div className="bg-white border border-gyment-border rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4 py-3.5 border-b border-gyment-border">
          <SkeletonBlock className="h-4 w-44 rounded" />
        </div>
        <TableSkeleton rows={3} columns={5} />
      </div>
    </div>
  );
};
