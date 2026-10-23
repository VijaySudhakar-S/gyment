'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useGymAdmin } from '@/context/GymAdminContext';
import { gymAdminApi } from '@/lib/api/gymadmin/gymAdmin.api';
import {
  GymAdminDashboardStats,
  GymRevenuePoint,
  GymAttendancePoint,
  GymGrowthPoint,
  GymMember,
  GymPaymentRecord,
  GymSubscriptionInfo,
} from '@/types/gymAdmin';
import { GymKpiCards } from '@/components/gym-admin/dashboard/GymKpiCards';
import { GymSvgLineChart } from '@/components/gym-admin/shared/GymSvgLineChart';
import { GymSvgBarChart } from '@/components/gym-admin/shared/GymSvgBarChart';
import { GymAdvancedAnalytics } from '@/components/gym-admin/dashboard/GymAdvancedAnalytics';
import { GymExpiryAlertsTable } from '@/components/gym-admin/dashboard/GymExpiryAlertsTable';
import { GymRecentPaymentsTable } from '@/components/gym-admin/dashboard/GymRecentPaymentsTable';
import { GymPlanComparisonCard } from '@/components/gym-admin/dashboard/GymPlanComparisonCard';
import { MemberDetailDrawer } from '@/components/gym-admin/members/MemberDetailDrawer';
import { GymAdminTopbar } from '@/components/gym-admin/layout/GymAdminTopbar';
import { MotionFadeIn } from '@/components/shared/MotionContainer';
import { App } from 'antd';

export default function GymAdminDashboardPage() {
  const { selectedBranch } = useGymAdmin();
  const { message } = App.useApp();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<GymAdminDashboardStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<GymRevenuePoint[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<GymAttendancePoint[]>([]);
  const [growthTrend, setGrowthTrend] = useState<GymGrowthPoint[]>([]);
  const [expiringMembers, setExpiringMembers] = useState<GymMember[]>([]);
  const [recentPayments, setRecentPayments] = useState<GymPaymentRecord[]>([]);
  const [subscription, setSubscription] = useState<GymSubscriptionInfo | null>(null);

  // Selected member for detail drawer
  const [selectedMember, setSelectedMember] = useState<GymMember | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await gymAdminApi.getDashboard(selectedBranch);
      if (res && res.data) {
        setStats(res.data.stats || null);
        setRevenueTrend(res.data.revenueTrend || []);
        setAttendanceTrend(res.data.attendanceTrend || []);
        setGrowthTrend(res.data.growthTrend || []);
        setExpiringMembers(res.data.expiringMembers || []);
        setRecentPayments(res.data.recentPayments || []);
        setSubscription(res.data.subscription || null);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleViewMember = (member: GymMember) => {
    setSelectedMember(member);
    setIsDrawerOpen(true);
  };

  const handleRenewMember = async (id: string | number) => {
    try {
      await gymAdminApi.quickRenewMember(id);
      message.success('Member subscription renewed successfully');
      fetchDashboardData();
    } catch (err) {
      message.error('Failed to renew member subscription');
    }
  };

  const revenueValues = revenueTrend.map((r) => r.amount);
  const revenueLabels = revenueTrend.map((r) => r.label);

  const attendanceValues = attendanceTrend.map((a) => a.visits);
  const attendanceLabels = attendanceTrend.map((a) => a.label);

  return (
    <>
      <GymAdminTopbar
        title="Dashboard"
        subtitle="Here's what's happening at your gym today."
      />
      <main className="p-4 sm:p-6 lg:p-7 w-full mx-auto pb-24 md:pb-12 space-y-7">
        {/* 1. KPI Cards */}
        <GymKpiCards stats={stats} isLoading={isLoading} />

        {/* 2. Membership Status & Operational Charts */}
        <MotionFadeIn delay={0.08}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-bold text-gyment-text">
              Membership Status & Trends
            </h2>
            <span className="text-xs text-gyment-muted">
              Real-time analytics
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Revenue Trend Line Chart */}
            <div className="lg:col-span-7 bg-white border border-gyment-border rounded-xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gyment-text">
                  Revenue Trend
                </h3>
                <span className="text-xs text-gyment-muted font-medium">
                  Last 6 months
                </span>
              </div>
              <GymSvgLineChart
                data={revenueValues}
                labels={revenueLabels}
                color="#2FAE68"
                height={190}
                isCurrency
              />
            </div>

            {/* Attendance Bar Chart */}
            <div className="lg:col-span-5 bg-white border border-gyment-border rounded-xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gyment-text">
                  Attendance
                </h3>
                <span className="text-xs text-gyment-muted font-medium">
                  Last 7 days
                </span>
              </div>
              <GymSvgBarChart
                data={attendanceValues}
                labels={attendanceLabels}
                color="#2FAE68"
                height={190}
              />
            </div>
          </div>
        </MotionFadeIn>

        {/* 3. Advanced Analytics (Plan Gated) */}
        <MotionFadeIn delay={0.14}>
          <div className="mb-3">
            <h2 className="text-base font-bold text-gyment-text">
              Advanced Analytics
            </h2>
            <p className="text-xs text-gyment-muted">
              Deeper insight into membership health &amp; growth
            </p>
          </div>
          <GymAdvancedAnalytics stats={stats} growthTrend={growthTrend} />
        </MotionFadeIn>

        {/* 4. Expiry Alerts */}
        <MotionFadeIn delay={0.20}>
          <div className="mb-3">
            <h2 className="text-base font-bold text-gyment-text">
              Expiry Alerts
            </h2>
            <p className="text-xs text-gyment-muted">
              Members needing renewal follow-up
            </p>
          </div>
          <GymExpiryAlertsTable
            members={expiringMembers}
            onViewMember={handleViewMember}
            onRenewMember={handleRenewMember}
          />
        </MotionFadeIn>

        {/* 5. Recent Payments */}
        <MotionFadeIn delay={0.24}>
          <div className="mb-3">
            <h2 className="text-base font-bold text-gyment-text">
              Recent Payments
            </h2>
            <p className="text-xs text-gyment-muted">
              Latest collections across the gym
            </p>
          </div>
          <GymRecentPaymentsTable payments={recentPayments} />
        </MotionFadeIn>

        {/* 6. Active GYMENT Plan & Features */}
        <MotionFadeIn delay={0.28}>
          <div className="mb-3">
            <h2 className="text-base font-bold text-gyment-text">
              Your GYMENT Plan
            </h2>
            <p className="text-xs text-gyment-muted">
              Active subscription status and enabled feature breakdown
            </p>
          </div>
          <GymPlanComparisonCard subscription={subscription} />
        </MotionFadeIn>

        {/* Member Details Drawer */}
        <MemberDetailDrawer
          member={selectedMember}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onRenew={handleRenewMember}
        />
      </main>
    </>
  );
}
