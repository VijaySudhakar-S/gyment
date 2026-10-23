'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import {
  GymAdminDashboardStats,
  GymRevenuePoint,
  GymBranchReport,
} from '@/types/gymAdmin';
import {
  ReportsKpis,
  RevenueTrendsCard,
  BranchWiseReportsCard,
  ExportReportsCard,
} from '@/components/gym-admin/reports/ReportsComponents';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';

export default function GymAdminReportsPage() {
  const [stats, setStats] = useState<GymAdminDashboardStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<GymRevenuePoint[]>([]);
  const [branchReports, setBranchReports] = useState<GymBranchReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReportsData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [dashRes, branchesRes] = await Promise.allSettled([
        gymAdminApi.getDashboard(),
        gymAdminApi.getBranchReports(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value?.data) {
        setStats(dashRes.value.data.stats || null);
        setRevenueTrend(dashRes.value.data.revenueTrend || []);
      }
      if (branchesRes.status === 'fulfilled' && Array.isArray(branchesRes.value?.data)) {
        setBranchReports(branchesRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  return (
    <>
      <GymAdminTopbar
        title="Reports"
        subtitle="Understand how your gym is performing with multi-dimensional reports."
      />
      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12 space-y-6">
        {/* 4 Summary Report Cards */}
        <MotionFadeIn delay={0.04}>
          <ReportsKpis stats={stats} />
        </MotionFadeIn>

        {/* Advanced Analytics */}
        <MotionFadeIn delay={0.12}>
          <RevenueTrendsCard revenueTrend={revenueTrend} />
        </MotionFadeIn>

        {/* Branch Reports */}
        <MotionFadeIn delay={0.18}>
          <BranchWiseReportsCard branchReports={branchReports} />
        </MotionFadeIn>

        {/* Export Options */}
        <MotionFadeIn delay={0.24}>
          <ExportReportsCard />
        </MotionFadeIn>
      </main>
    </>
  );
}
