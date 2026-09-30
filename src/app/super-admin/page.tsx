'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button } from 'antd';
import { Plus } from 'lucide-react';

import { Topbar } from '@/components/super-admin/header/Topbar';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Timeline } from '@/components/shared/Timeline';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { SubscriptionDonutChart } from '@/components/charts/SubscriptionDonutChart';
import { initials, fmtRs } from '@/lib/formatters';
import { MotionFadeIn, MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { dashboardApi, DashboardOverviewData } from '@/lib/api/superadmin/dashboard.api';
import { GymData } from '@/lib/api/superadmin/gyms.api';
import { AddGymModal } from '@/components/super-admin/modals/AddGymModal';

export default function DashboardPage() {
  const router = useRouter();
  const [isAddGymModalOpen, setIsAddGymModalOpen] = useState(false);

  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await dashboardApi.getOverview();
      if (res.status && res.data) {
        setOverview(res.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard overview:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const totalGyms = overview?.totalGyms ?? 0;
  const activeGyms = overview?.activeGyms ?? 0;
  const trialGyms = overview?.trialGyms ?? 0;
  const suspendedGyms = overview?.suspendedGyms ?? 0;
  const totalMembers = overview?.totalMembers ?? 0;
  const mrr = overview?.monthlyRecurringRevenue ?? 0;
  const totalRevenue = overview?.totalRevenue ?? 0;
  const activeSubs = overview?.activeSubscriptions ?? 0;
  const expiringSubs = overview?.expiringSubscriptions ?? 0;
  const recentGyms: GymData[] = overview?.recentGyms ?? [];
  const activity = (overview?.recentActivity ?? []).map((a: any) => {
    let icon: 'GYM' | 'UPGRADE' | 'WARN' | 'BAN' | 'SUPPORT' | 'USERS' | 'REVENUE' | 'LOGIN' = 'GYM';
    let tone: 'green' | 'blue' | 'amber' | 'red' = 'blue';

    if (a.type === 'SUBSCRIPTION') {
      icon = 'UPGRADE';
      tone = 'amber';
    } else if (a.type === 'STATUS') {
      icon = 'WARN';
      tone = 'red';
    } else if (a.type === 'SETTINGS') {
      icon = 'SUPPORT';
      tone = 'blue';
    } else if (a.type === 'CREATE') {
      icon = 'GYM';
      tone = 'green';
    }

    return {
      id: a.id,
      t: a.action,
      d: a.details,
      ti: new Date(a.time).toLocaleDateString(),
      icon,
      tone,
    };
  });

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle="Monitor and manage the GYMENT platform from one place."
        actions={
          <button
            type="button"
            onClick={() => setIsAddGymModalOpen(true)}
            className="bg-linear-to-t from-primary/85 to-primary-dark text-white hover:bg-primary-dark px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-all duration-100 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-2" />
            <span className="hidden sm:inline">Add Gym</span>
          </button>
        }
      />
      <main className="p-4 sm:p-5 w-full mx-auto space-y-6">
        {/* Primary KPI Row */}
        <MotionStagger className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MotionItem><StatCard label="Total Gyms" value={totalGyms} delta="Registered" deltaType="neu" /></MotionItem>
          <MotionItem><StatCard label="Active Gyms" value={activeGyms} delta="Operational" deltaType="up" /></MotionItem>
          <MotionItem><StatCard label="Trial Gyms" value={trialGyms} delta="Under evaluation" deltaType="neu" /></MotionItem>
          <MotionItem><StatCard
            label="Suspended Gyms"
            value={suspendedGyms}
            delta="Action required"
            deltaType={suspendedGyms > 0 ? 'down' : 'neu'}
          /></MotionItem>
          <MotionItem><StatCard
            label="Total Platform Users"
            value={totalMembers.toLocaleString('en-IN')}
            delta="Gym staff & admins"
            deltaType="up"
          /></MotionItem>
          <MotionItem><StatCard
            label="Monthly Recurring Revenue"
            value={fmtRs(mrr)}
            delta="Active subscriptions"
            deltaType="up"
          /></MotionItem>
          <MotionItem><StatCard
            label="Active Subscriptions"
            value={activeSubs}
            delta="Billing active"
            deltaType="up"
          /></MotionItem>
          <MotionItem><StatCard
            label="Expiring Subscriptions"
            value={expiringSubs}
            delta="Within 30 days"
            deltaType={expiringSubs > 0 ? 'down' : 'neu'}
          /></MotionItem>
        </MotionStagger>

        {/* Charts Section */}
        <MotionFadeIn delay={0.12}>
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-gyment-text m-0">Platform Overview</h2>
              <p className="text-xs text-gyment-muted m-0">Live aggregated subscription performance</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Revenue Chart Card */}
            <div className="lg:col-span-7 bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
              <div className="flex justify-between items-baseline mb-2.5">
                <h3 className="text-sm font-bold text-gyment-text m-0">
                  Monthly Platform Revenue
                </h3>
                <span className="text-xs text-gyment-muted">Last 6 Months</span>
              </div>
              <RevenueChart
                labels={overview?.revenueTrends?.labels || []}
                data={overview?.revenueTrends?.data || []}
              />
            </div>

            {/* Subscription Distribution Card */}
            <div className="lg:col-span-5 bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
              <div className="flex justify-between items-baseline mb-2.5">
                <h3 className="text-sm font-bold text-gyment-text m-0">
                  Subscription Distribution
                </h3>
                <span className="text-xs text-gyment-muted">By active plan</span>
              </div>
              <SubscriptionDonutChart
                data={(overview?.subscriptionDistribution || []).map((p, i) => ({
                  name: p.name,
                  value: p.value,
                  color: ['#22935A', '#2FAE68', '#8FA098', '#114a2d', '#42df8a'][i % 5],
                }))}
              />
            </div>
          </div>

          {/* Secondary KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3.5">
            <StatCard
              label="MRR Run-rate"
              value={fmtRs(mrr)}
              delta="Monthly recurring"
              deltaType="up"
            />
            <StatCard
              label="Annual Run-rate (ARR)"
              value={fmtRs(mrr * 12)}
              delta="Projected annualized"
              deltaType="neu"
            />
            <StatCard
              label="Total Revenue Collected"
              value={fmtRs(totalRevenue)}
              delta="Lifetime subscriptions"
              deltaType="up"
            />
            <StatCard
              label="Avg Revenue / Gym"
              value={activeGyms > 0 ? fmtRs(Math.round(mrr / activeGyms)) : '₹0'}
              delta="Per active facility"
              deltaType="neu"
            />
          </div>
        </MotionFadeIn>

        {/* Recent Activity */}
        <MotionFadeIn delay={0.2}>
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-gyment-text m-0">Recent Activity</h2>
              <p className="text-xs text-gyment-muted m-0">Platform audit logs and events</p>
            </div>
          </div>
          <div className="bg-white border border-gyment-border rounded-xl p-4 sm:p-5">
            <Timeline items={activity} />
          </div>
        </MotionFadeIn>

        {/* New Gym Registrations Table */}
        <MotionFadeIn delay={0.26}>
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-gyment-text m-0">
                New Gym Registrations
              </h2>
              <p className="text-xs text-gyment-muted m-0">Recently onboarded facilities</p>
            </div>
          </div>

          <div className="bg-white border border-gyment-border rounded-xl overflow-hidden shadow-2xs">
            <Table<GymData>
              dataSource={recentGyms}
              rowKey="id"
              loading={isLoading}
              pagination={false}
              columns={[
                {
                  title: 'GYM',
                  dataIndex: 'name',
                  key: 'name',
                  render: (_, gym) => (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-bold text-xs shrink-0">
                        {initials(gym.name)}
                      </div>
                      <div>
                        <div className="font-bold text-gyment-text">{gym.name}</div>
                        <div className="text-[11px] text-gyment-muted">{gym.code} • {gym.location}</div>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'OWNER',
                  dataIndex: 'ownerName',
                  key: 'ownerName',
                  render: (_, gym) => gym.ownerName || gym.primaryAdmin?.name || '-',
                },
                {
                  title: 'PLAN',
                  key: 'plan',
                  render: (_, gym) => gym.activeSubscription?.planName || '-',
                },
                {
                  title: 'STATUS',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => <StatusBadge status={status} />,
                },
                {
                  title: 'REGISTERED',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  render: (val) => new Date(val).toLocaleDateString(),
                },
                {
                  title: '',
                  key: 'actions',
                  align: 'right',
                  render: (_, gym) => (
                    <Button
                      size="small"
                      onClick={() => router.push(`/super-admin/gyms/${gym.id}`)}
                      className="text-xs font-semibold"
                    >
                      View
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </MotionFadeIn>
      </main>
      <AddGymModal 
        open={isAddGymModalOpen} 
        onClose={() => setIsAddGymModalOpen(false)} 
        onSuccess={() => fetchDashboardData()} 
      />
    </>
  );
}
