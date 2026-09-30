'use client';

import React from 'react';
import { SkeletonBlock } from '@/components/shared/skeletons/SkeletonBase';

export const SuperAdminSkeleton: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gyment-bg text-gyment-text select-none">
      {/* Sidebar Skeleton (hidden on mobile, visible md+) */}
      <aside className="w-64 bg-[#16211B] hidden md:flex flex-col p-3.5 pt-4 shrink-0 h-screen sticky top-0 border-r border-white/8">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-5">
          <div className="w-8 h-8 rounded-lg bg-white/10 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3.5 w-20 bg-white/15 rounded" />
            <div className="h-2.5 w-14 bg-white/10 rounded" />
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex flex-col gap-2 mt-2 flex-1">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-3 rounded-lg mb-2 bg-white/5"
            >
              <div className="w-4.5 h-4.5 rounded bg-white/10 shrink-0" />
              <div
                className="h-3 rounded bg-white/10"
                style={{ width: `${60 + (i % 4) * 12}%` }}
              />
            </div>
          ))}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="mt-auto pt-3.5 border-t border-white/8">
          <div className="flex items-center gap-2.5 px-1.5 py-2">
            <div className="w-8 h-8 rounded-full bg-[#E7F6ED] shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3 w-20 bg-white/15 rounded" />
              <div className="h-2.5 w-16 bg-white/10 rounded" />
            </div>
          </div>
          <div className="w-full mt-2.5 h-8 bg-white/6 rounded-lg" />
        </div>
      </aside>

      {/* Main Area Skeleton */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar Skeleton */}
        <header className="bg-white border-b border-gyment-border px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex flex-col gap-1.5">
            <SkeletonBlock className="h-5 w-32 rounded" />
            <SkeletonBlock className="h-3 w-48 rounded hidden sm:block" />
          </div>

          <div className="flex items-center gap-2.5">
            <SkeletonBlock className="w-9 h-9 rounded-lg" />
            <SkeletonBlock className="w-9 h-9 rounded-lg" />
            <SkeletonBlock className="w-9 h-9 rounded-lg" />
            <div className="hidden lg:flex flex-col gap-1 pl-1">
              <SkeletonBlock className="h-3.5 w-24 rounded" />
              <SkeletonBlock className="h-2.5 w-16 rounded" />
            </div>
          </div>
        </header>

        {/* Content Skeleton */}
        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          {/* KPI Stat Cards (4 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gyment-border rounded-xl p-4.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <SkeletonBlock className="h-3.5 w-20 rounded" />
                  <SkeletonBlock className="w-8 h-8 rounded-lg" />
                </div>
                <SkeletonBlock className="h-7 w-24 rounded" />
              </div>
            ))}
          </div>

          {/* Main Chart / Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Large Card Skeleton (2 cols) */}
            <div className="lg:col-span-2 bg-white border border-gyment-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gyment-border/40">
                <SkeletonBlock className="h-4 w-36 rounded" />
                <SkeletonBlock className="h-7 w-24 rounded" />
              </div>
              <div className="h-64 w-full flex items-end gap-3 p-4 border border-dashed border-gyment-border/40 rounded-lg">
                {[...Array(12)].map((_, idx) => (
                  <SkeletonBlock
                    key={idx}
                    className="flex-1 rounded-t"
                    style={{ height: `${20 + (idx % 6) * 14}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Side Card Skeleton (1 col) */}
            <div className="bg-white border border-gyment-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gyment-border/40">
                <SkeletonBlock className="h-4 w-28 rounded" />
                <SkeletonBlock className="h-3 w-14 rounded" />
              </div>
              <div className="space-y-3.5">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <SkeletonBlock className="w-8 h-8 rounded-full shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <SkeletonBlock className="h-3 w-full rounded" />
                      <SkeletonBlock className="h-2.5 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
