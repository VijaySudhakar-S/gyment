'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download } from 'lucide-react';
import { App } from 'antd';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatCard } from '@/components/shared/StatCard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { SubscriptionComparisonBarChart } from '@/components/charts/SubscriptionComparisonBarChart';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { fmtRs } from '@/lib/formatters';
import { revenueApi, RevenueStatsData } from '@/lib/api/superadmin/revenue.api';
import { reportsApi } from '@/lib/api/superadmin/reports.api';

export default function RevenuePage() {
  const { message } = App.useApp();

  const [stats, setStats] = useState<RevenueStatsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchRevenueData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await revenueApi.getStats();
      if (res.status && res.data) {
        setStats(res.data);
      }
    } catch (error: any) {
      message.error(error.message || 'Failed to load revenue statistics');
    } finally {
      setIsLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchRevenueData();
  }, [fetchRevenueData]);

  const handleExport = async () => {
    try {
      const res = await reportsApi.exportData('revenue');
      if (res.status && res.data) {
        const blob = new Blob([res.data.content], { type: res.data.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.filename;
        a.click();
        URL.revokeObjectURL(url);
        message.success('Revenue export downloaded successfully');
      }
    } catch (error) {
      message.error('Failed to export revenue');
    }
  };

  const mrr = stats?.monthlyRecurringRevenue ?? 0;
  const totalRevenue = stats?.totalSubscriptionRevenue ?? 0;
  const avgRev = stats?.averageRevenuePerGym ?? 0;
  const activePayingGyms = stats?.activePayingGyms ?? 0;
  const newSubs = stats?.newPaidSubscriptions30Days ?? 0;
  const cancelledSubs = stats?.cancelledSubscriptions30Days ?? 0;
  const planBreakdown = stats?.planBreakdown ?? [];

  return (
    <>
      <Topbar
        title="Revenue"
        subtitle="GYMENT's platform subscription revenue — not gym member payments."
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Revenue</span>
          </button>
        }
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-6">
        {/* KPI Cards */}
        <MotionStagger className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MotionItem>
            <StatCard
              label="Monthly Recurring Revenue"
              value={fmtRs(mrr)}
              delta="Active MRR"
              deltaType="up"
            />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="Total Platform Revenue"
              value={fmtRs(totalRevenue)}
              delta="Cumulative to date"
              deltaType="neu"
            />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="Average Revenue / Gym"
              value={fmtRs(avgRev)}
              delta="Per active facility"
              deltaType="neu"
            />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="Active Paying Gyms"
              value={activePayingGyms}
              delta="Active subscriptions"
              deltaType="up"
            />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="New Paid Subscriptions"
              value={newSubs}
              delta="Last 30 days"
              deltaType="up"
            />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="Cancelled Subscriptions"
              value={cancelledSubs}
              delta="Last 30 days"
              deltaType={cancelledSubs > 0 ? 'down' : 'neu'}
            />
          </MotionItem>
        </MotionStagger>

        {/* Trends Section */}
        <MotionFadeIn delay={0.12}>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-[15.5px] font-bold text-gyment-text m-0">Revenue Analytics</h2>
              <p className="text-[12px] text-gyment-muted m-0">Live aggregated performance trends</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3.5">
            <div className="bg-white border border-gyment-border rounded-[14px] p-4.5">
              <div className="flex justify-between items-baseline mb-2.5">
                <h3 className="text-[13.5px] font-bold text-gyment-text m-0">Monthly Revenue</h3>
                <span className="text-[12px] text-gyment-muted">Last 6 Months</span>
              </div>
              <RevenueChart
                labels={stats?.monthlyTrends?.map(t => t.month) || []}
                data={stats?.monthlyTrends?.map(t => t.revenue) || []}
              />
            </div>

            <div className="bg-white border border-gyment-border rounded-[14px] p-4.5">
              <div className="flex justify-between items-baseline mb-2.5">
                <h3 className="text-[13.5px] font-bold text-gyment-text m-0">
                  New vs Cancelled Subscriptions
                </h3>
                <span className="text-[12px] text-gyment-muted">Last 6 months</span>
              </div>
              <SubscriptionComparisonBarChart
                months={stats?.monthlyTrends?.map(t => t.month) || []}
                newSubs={stats?.monthlyTrends?.map(t => t.newSubscriptions) || []}
                cancelledSubs={stats?.monthlyTrends?.map(t => t.cancelledSubscriptions) || []}
              />
            </div>
          </div>
        </MotionFadeIn>

        {/* Revenue by Plan */}
        <MotionFadeIn delay={0.18}>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15.5px] font-bold text-gyment-text m-0">Revenue by Plan</h2>
          </div>

          <div className="bg-white border border-gyment-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                      Plan
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                      Active Gyms
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                      Monthly Price
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wider text-gyment-muted font-bold px-3 py-2.5 border-b border-gyment-border whitespace-nowrap">
                      Monthly Run-Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gyment-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gyment-muted">
                        Loading plan revenue metrics...
                      </td>
                    </tr>
                  ) : planBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gyment-muted">
                        No active plans recorded.
                      </td>
                    </tr>
                  ) : (
                    planBreakdown.map((plan: any) => (
                      <tr key={plan.planId} className="hover:bg-gyment-bg transition-colors">
                        <td className="px-3 py-2.5 font-bold text-gyment-text">{plan.planName}</td>
                        <td className="px-3 py-2.5 text-gyment-text">{plan.activeGymsCount}</td>
                        <td className="px-3 py-2.5 text-gyment-text">{fmtRs(plan.price)}</td>
                        <td className="px-3 py-2.5 font-semibold text-gyment-text">
                          {fmtRs(plan.monthlyRevenue)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </MotionFadeIn>
      </main>
    </>
  );
}
