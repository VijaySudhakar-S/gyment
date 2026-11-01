import React from 'react';
import { fmtRs } from '@/utils/gymAdminHelpers';
import { ReactEChart } from '@/components/charts/ReactEChart';
import { useTheme } from '@/context/ThemeContext';
import {
  Users,
  TrendingUp,
  ReceiptIndianRupee,
  Clock,
  Download,
  Lock,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Layers,
  CalendarCheck,
  Percent,
} from 'lucide-react';
import { App, Table, Tag } from 'antd';
import type { EChartsOption } from 'echarts';

// ----------------------------------------------------
// 1. Executive Summary Metric Strips for Gym Owner
// ----------------------------------------------------
export const OwnerFinancialHealthBar: React.FC<{
  summary: {
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    expiring7d: number;
    retentionRate: number;
    monthRevenue: number;
    totalLifetimeRevenue: number;
    totalPendingDues: number;
    todayAttendance: number;
    avgDailyAttendance: number;
  } | null;
}> = ({ summary }) => {
  const monthRev = summary?.monthRevenue ?? 0;
  const pendingDues = summary?.totalPendingDues ?? 0;
  const activeMembers = summary?.activeMembers ?? 0;
  const totalMembers = summary?.totalMembers ?? 0;
  const retention = summary?.retentionRate ?? 0;
  const dailyVisits = summary?.todayAttendance ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Monthly Revenue Collections */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-muted text-xs font-semibold">
          <span>This Month Revenue</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ReceiptIndianRupee className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-[26px] font-black text-gyment-text mt-2 leading-tight">
          {fmtRs(monthRev)}
        </div>
        <div className="flex items-center justify-between text-xs text-muted mt-2 pt-2 border-t border-dashed border-border/80">
          <span>Lifetime:</span>
          <span className="font-bold text-stone-700 dark:text-stone-300">
            {fmtRs(summary?.totalLifetimeRevenue ?? 0)}
          </span>
        </div>
      </div>

      {/* 2. Outstanding Balance & Receivables */}
      <div className="bg-white border border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-xs font-bold">
          <span>Pending Dues</span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <CreditCard className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-[26px] font-black text-rose-600 dark:text-rose-400 mt-2 leading-tight">
          {fmtRs(pendingDues)}
        </div>
        <div className="flex items-center justify-between text-xs text-muted mt-2 pt-2 border-t border-dashed border-border/80">
          <span>Status:</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">
            {pendingDues > 0 ? 'Action Needed' : 'All Clear ✓'}
          </span>
        </div>
      </div>

      {/* 3. Active Members & Retention Rate */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-muted text-xs font-semibold">
          <span>Active Membership</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-[26px] font-black text-gyment-text mt-2 leading-tight">
          {activeMembers}
          <span className="text-xs font-semibold text-muted ml-1.5 font-normal">
            / {totalMembers} registered
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted mt-2 pt-2 border-t border-dashed border-border/80">
          <span>Retention Health:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {retention}% Active
          </span>
        </div>
      </div>

      {/* 4. Today's Footfall & Peak Turnout */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-muted text-xs font-semibold">
          <span>Today&apos;s Attendance</span>
          <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <CalendarCheck className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-[26px] font-black text-gyment-text mt-2 leading-tight">
          {dailyVisits}
          <span className="text-xs text-muted font-normal ml-1">check-ins</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted mt-2 pt-2 border-t border-dashed border-border/80">
          <span>30d Daily Avg:</span>
          <span className="font-bold text-stone-700 dark:text-stone-300">
            ~{summary?.avgDailyAttendance ?? 0} visits / day
          </span>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 2. Revenue & Member Growth Dual-Axis EChart
// ----------------------------------------------------
export const RevenueAndGrowthChart: React.FC<{
  monthlyTrends: Array<{
    label: string;
    revenue: number;
    newMembers: number;
    attendance: number;
  }>;
}> = ({ monthlyTrends }) => {
  const { isDark } = useTheme();

  const labels = monthlyTrends.map((t) => t.label);
  const revenues = monthlyTrends.map((t) => t.revenue);
  const signups = monthlyTrends.map((t) => t.newMembers);

  const option = React.useMemo<EChartsOption>(() => {
    return {
      backgroundColor: 'transparent',
      grid: {
        top: 36,
        right: 48,
        bottom: 24,
        left: 48,
        containLabel: true,
      },
      legend: {
        data: ['Revenue (₹)', 'New Signups'],
        textStyle: {
          color: isDark ? '#D4D4D4' : '#4B5563',
          fontSize: 12,
        },
        top: 0,
        right: 16,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        backgroundColor: isDark ? '#1C1C1C' : '#FFFFFF',
        borderColor: isDark ? '#2E2E2E' : '#E3E8E5',
        borderWidth: 1,
        textStyle: { color: isDark ? '#FFFFFF' : '#16211B', fontSize: 12 },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          const month = params[0]?.name;
          let content = `<div style="font-weight: 700; margin-bottom: 4px;">${month}</div>`;
          params.forEach((p) => {
            const val = p.seriesName.includes('Revenue') ? fmtRs(p.value) : `${p.value} members`;
            content += `<div style="display:flex; justify-content:space-between; gap:16px; font-size:12px;">
              <span style="color:${p.color}">${p.seriesName}:</span>
              <b>${val}</b>
            </div>`;
          });
          return content;
        },
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLine: { lineStyle: { color: isDark ? '#333' : '#E5E7EB' } },
        axisLabel: { color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          name: 'Revenue',
          position: 'left',
          axisLabel: {
            formatter: (v: number) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`,
            color: isDark ? '#9CA3AF' : '#6B7280',
          },
          splitLine: {
            lineStyle: {
              color: isDark ? '#262626' : '#F3F4F6',
              type: 'dashed',
            },
          },
        },
        {
          type: 'value',
          name: 'Signups',
          position: 'right',
          minInterval: 1,
          axisLabel: {
            formatter: '{value}',
            color: isDark ? '#9CA3AF' : '#6B7280',
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Revenue (₹)',
          type: 'bar',
          data: revenues,
          yAxisIndex: 0,
          barMaxWidth: 32,
          itemStyle: {
            color: '#10B981',
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: 'New Signups',
          type: 'line',
          data: signups,
          yAxisIndex: 1,
          smooth: true,
          symbolSize: 8,
          lineStyle: { color: '#3B82F6', width: 3 },
          itemStyle: { color: '#3B82F6' },
        },
      ],
    };
  }, [labels, revenues, signups, isDark]);

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-gyment-text flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Revenue Collections & Member Growth Trend</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Compare monthly revenue collected against new member signups over the past 6 months
          </p>
        </div>
      </div>
      <ReactEChart option={option} height={280} />
    </div>
  );
};

// ----------------------------------------------------
// 3. Plan Performance & Revenue Contribution Table
// ----------------------------------------------------
export const PlanDistributionReportCard: React.FC<{
  planDistribution: Array<{
    id: string;
    name: string;
    price: number;
    activeMembers: number;
    totalRevenue: number;
  }>;
}> = ({ planDistribution }) => {
  const totalRevenueAllPlans = planDistribution.reduce((acc, p) => acc + p.totalRevenue, 0);

  const columns = [
    {
      title: 'MEMBERSHIP PLAN',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span className="font-bold text-gyment-text text-[13px]">{name}</span>
      ),
    },
    {
      title: 'PLAN PRICE',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <span className="text-muted text-xs font-semibold">{fmtRs(price)}</span>
      ),
    },
    {
      title: 'ACTIVE MEMBERS',
      dataIndex: 'activeMembers',
      key: 'activeMembers',
      render: (count: number) => (
        <span className="font-bold text-stone-800 dark:text-stone-200 text-xs px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded">
          {count} members
        </span>
      ),
    },
    {
      title: 'TOTAL REVENUE',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (rev: number) => (
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
          {fmtRs(rev)}
        </span>
      ),
    },
    {
      title: 'REVENUE SHARE',
      key: 'share',
      render: (_: any, p: any) => {
        const share = totalRevenueAllPlans > 0 ? Math.round((p.totalRevenue / totalRevenueAllPlans) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${share}%` }} />
            </div>
            <span className="text-[11px] font-bold text-muted">{share}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gyment-text flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Membership Plan Revenue Breakdown</span>
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Popularity and financial contribution by membership tier
          </p>
        </div>
      </div>
      <Table
        dataSource={planDistribution}
        columns={columns}
        rowKey="id"
        pagination={false}
        scroll={{ x: 550 }}
        size="small"
      />
    </div>
  );
};

// ----------------------------------------------------
// 4. Hourly Peak Attendance & Payment Methods Distribution
// ----------------------------------------------------
export const OperationsAndMethodsCard: React.FC<{
  paymentMethods: Array<{ method: string; amount: number; count: number }>;
  hourlyPeak: Array<{ slot: string; visits: number }>;
}> = ({ paymentMethods, hourlyPeak }) => {
  const { isDark } = useTheme();

  const totalVisits = hourlyPeak.reduce((acc, h) => acc + h.visits, 0);

  // EChart for payment methods breakdown
  const pieOption = React.useMemo<EChartsOption>(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => `${p.name}: <b>${fmtRs(p.value)}</b> (${p.percent}%)`,
      },
      legend: {
        bottom: 0,
        textStyle: { color: isDark ? '#D4D4D4' : '#4B5563', fontSize: 11 },
      },
      series: [
        {
          name: 'Payment Methods',
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: false,
          label: { show: false },
          data: paymentMethods.map((pm) => ({
            name: pm.method,
            value: pm.amount,
          })),
        },
      ],
    };
  }, [paymentMethods, isDark]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Hourly Gym Peak Traffic */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-gyment-text flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>Gym Peak Hours & Footfall Density</span>
        </h3>
        <p className="text-xs text-muted mb-4">
          Time-of-day distribution of member check-ins (Past 30 days)
        </p>

        <div className="space-y-3">
          {hourlyPeak.map((slot) => {
            const percent = totalVisits > 0 ? Math.round((slot.visits / totalVisits) * 100) : 0;
            return (
              <div key={slot.slot} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gyment-text">{slot.slot}</span>
                  <span className="text-muted">
                    {slot.visits} visits <b>({percent}%)</b>
                  </span>
                </div>
                <div className="w-full h-2 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method Distribution */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-gyment-text flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Collection Channels (UPI vs Cash vs Card)</span>
          </h3>
          <p className="text-xs text-muted mb-2">
            Payment instrument preference across all member transactions
          </p>
        </div>

        <div className="h-56">
          <ReactEChart option={pieOption} height={220} />
        </div>
      </div>
    </div>
  );
};




