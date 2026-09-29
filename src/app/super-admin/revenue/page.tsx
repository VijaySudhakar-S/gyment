'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { App } from 'antd';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatCard } from '@/components/shared/StatCard';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { SubscriptionComparisonBarChart } from '@/components/charts/SubscriptionComparisonBarChart';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { fmtRs } from '@/lib/formatters';

export default function RevenuePage() {
  const { message } = App.useApp();
  const { gyms, plans } = useSuperAdmin();

  const handleExport = () => {
    message.success('Revenue export prepared');
  };

  const activePayingGyms = gyms.filter(g => g.subStatus === 'Active').length;

  const planKeys = ['starter', 'growth', 'pro'];

  return (
    <>
      <Topbar
        title="Revenue"
        subtitle="GYMENT's platform subscription revenue — not gym member payments."
        actions={
          <button
            type="button"
            onClick={handleExport}
            className="border border-gyment-border bg-white hover:bg-gyment-bg px-3.5 py-2 rounded-[9px] text-[13px] font-semibold text-gyment-text flex items-center gap-1.5 transition-colors shrink-0"
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
              value="₹16.9L"
              delta="+9% MoM"
              deltaType="up"
            />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="Total Subscription Revenue"
              value="₹1.42Cr"
              delta="Year to date"
              deltaType="neu"
            />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="Average Revenue / Gym"
              value="₹1,180"
              delta="Per month"
              deltaType="neu"
            />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="Active Paying Gyms"
              value={activePayingGyms}
              delta="+12 this month"
              deltaType="up"
            />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="New Paid Subscriptions"
              value={23}
              delta="Last 30 days"
              deltaType="up"
            />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="Cancelled Subscriptions"
              value={4}
              delta="Last 30 days"
              deltaType="down"
            />
          </MotionItem>
        </MotionStagger>

        {/* Trends Section */}
        <MotionFadeIn delay={0.12}>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-[15.5px] font-bold text-gyment-text m-0">Trends</h2>
              <p className="text-[12px] text-gyment-muted m-0">Demo data only</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3.5">
            <div className="bg-white border border-gyment-border rounded-[14px] p-4.5">
              <div className="flex justify-between items-baseline mb-2.5">
                <h3 className="text-[13.5px] font-bold text-gyment-text m-0">Monthly Revenue</h3>
                <span className="text-[12px] text-gyment-muted">Jan – Sep</span>
              </div>
              <RevenueChart />
            </div>

            <div className="bg-white border border-gyment-border rounded-[14px] p-4.5">
              <div className="flex justify-between items-baseline mb-2.5">
                <h3 className="text-[13.5px] font-bold text-gyment-text m-0">
                  New vs Cancelled Subscriptions
                </h3>
                <span className="text-[12px] text-gyment-muted">Last 6 months</span>
              </div>
              <SubscriptionComparisonBarChart />
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
                      Monthly Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gyment-border">
                  {planKeys.map(key => {
                    const p = plans[key];
                    if (!p) return null;
                    const count = gyms.filter(
                      g => g.plan.toLowerCase() === key && g.subStatus === 'Active'
                    ).length;
                    const rev = count * p.price;

                    return (
                      <tr key={key} className="hover:bg-gyment-bg transition-colors">
                        <td className="px-3 py-2.5 font-bold text-gyment-text">{p.name}</td>
                        <td className="px-3 py-2.5 text-gyment-text">{count}</td>
                        <td className="px-3 py-2.5 font-semibold text-gyment-text">
                          {fmtRs(rev)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </MotionFadeIn>
      </main>
    </>
  );
}
