'use client';

import React, { useMemo } from 'react';
import { ReactEChart } from './ReactEChart';
import { useTheme } from '@/context/ThemeContext';
import { fmtRs } from '@/lib/formatters';
import type { EChartsOption } from 'echarts';
import { GymReportMetrics, SubscriptionReportMetrics, UserReportMetrics } from '@/types/report';

// ----------------------------------------------------
// 1. Gyms Status & Growth Chart (Column Bar)
// ----------------------------------------------------
export const GymsReportChart: React.FC<{ data?: GymReportMetrics }> = ({ data }) => {
  const { isDark } = useTheme();

  const categories = ['Active', 'New (Month)', 'Suspended', 'Cancelled'];
  const values = [
    data?.activeGyms ?? 0,
    data?.newThisMonth ?? 0,
    data?.suspendedGyms ?? 0,
    data?.cancelledGyms ?? 0,
  ];
  const colors = ['#22935A', '#0EA5E9', '#F59E0B', '#EF4444'];

  const option = useMemo<EChartsOption>(() => {
    return {
      backgroundColor: 'transparent',
      grid: {
        top: 24,
        right: 16,
        bottom: 8,
        left: 8,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: isDark ? '#1C1C1C' : '#16211B',
        borderColor: isDark ? '#2E2E2E' : '#16211B',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#ffffff', fontSize: 12 },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const item = params[0];
          return `
            <div style="font-weight: 600; font-size: 11.5px; opacity: 0.85;">${item.name}</div>
            <div style="font-weight: 700; font-size: 13px; color: ${item.color}; margin-top: 2px;">
              ${item.value} gyms
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: {
          show: true,
          lineStyle: { color: isDark ? '#262626' : '#E5E7EB' },
        },
        axisTick: { show: false },
        axisLabel: {
          color: isDark ? '#A1A1A1' : '#4B5563',
          fontSize: 11,
          interval: 0,
        },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            color: isDark ? '#1F1F1F' : '#F3F4F6',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: isDark ? '#8C8C8C' : '#6B7280',
          fontSize: 10.5,
        },
      },
      series: [
        {
          name: 'Gyms',
          type: 'bar',
          data: values.map((val, idx) => ({
            value: val,
            itemStyle: {
              color: colors[idx],
              borderRadius: [5, 5, 0, 0],
            },
          })),
          barMaxWidth: 38,
          label: {
            show: true,
            position: 'top',
            color: isDark ? '#EDEDED' : '#16211B',
            fontSize: 11,
            fontWeight: 600,
          },
        },
      ],
    };
  }, [data, isDark]);

  return <ReactEChart option={option} height={210} />;
};

// ----------------------------------------------------
// 2. Subscription Health Donut Chart
// ----------------------------------------------------
export const SubscriptionReportChart: React.FC<{ data?: SubscriptionReportMetrics }> = ({ data }) => {
  const { isDark } = useTheme();

  const items = [
    { name: 'Active', value: data?.activeSubscriptions ?? 0, color: '#22935A' },
    { name: 'Trial', value: data?.trialSubscriptions ?? 0, color: '#38BDF8' },
    { name: 'Past Due', value: data?.pastDueSubscriptions ?? 0, color: '#F43F5E' },
  ].filter(i => i.value > 0);

  const total = items.reduce((sum, i) => sum + i.value, 0);

  const option = useMemo<EChartsOption>(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#1C1C1C' : '#16211B',
        borderColor: isDark ? '#2E2E2E' : '#16211B',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#ffffff', fontSize: 12 },
        formatter: (params: any) => `
          <div style="font-weight: 600; font-size: 11.5px; opacity: 0.85;">${params.name}</div>
          <div style="font-weight: 700; font-size: 13px; color: ${params.color}; margin-top: 2px;">
            ${params.value} subscriptions (${params.percent}%)
          </div>
        `,
      },
      legend: {
        orient: 'vertical',
        right: '2%',
        top: 'middle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 10,
        icon: 'circle',
        textStyle: {
          color: isDark ? '#D1D5DB' : '#374151',
          fontSize: 11.5,
          fontWeight: 500,
        },
      },
      series: [
        {
          name: 'Subscription Health',
          type: 'pie',
          radius: ['52%', '78%'],
          center: ['36%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 5,
            borderColor: isDark ? '#141414' : '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            scale: true,
            scaleSize: 5,
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 700,
              color: isDark ? '#FFFFFF' : '#16211B',
              formatter: '{b}\n{d}%',
            },
          },
          data: items.map(i => ({
            name: i.name,
            value: i.value,
            itemStyle: { color: i.color },
          })),
        },
      ],
    };
  }, [items, total, isDark]);

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-[210px] text-gyment-muted text-xs border border-dashed border-gyment-border rounded-lg">
        No active subscription data available
      </div>
    );
  }

  return <ReactEChart option={option} height={210} />;
};

// ----------------------------------------------------
// 3. User Role Demographics (Horizontal Bar)
// ----------------------------------------------------
export const UserDemographicsChart: React.FC<{ data?: UserReportMetrics }> = ({ data }) => {
  const { isDark } = useTheme();

  const categories = ['Trainers', 'Receptionists', 'Gym Owners', 'Super Admins'];
  const values = [
    data?.trainers ?? 0,
    data?.staffUsers ?? 0,
    data?.gymOwners ?? 0,
    data?.superAdmins ?? 0,
  ];
  const barColors = ['#F59E0B', '#6366F1', '#10B981', '#8B5CF6'];

  const option = useMemo<EChartsOption>(() => {
    return {
      backgroundColor: 'transparent',
      grid: {
        top: 14,
        right: 32,
        bottom: 8,
        left: 12,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: isDark ? '#1C1C1C' : '#16211B',
        borderColor: isDark ? '#2E2E2E' : '#16211B',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#ffffff', fontSize: 12 },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const item = params[0];
          return `
            <div style="font-weight: 600; font-size: 11.5px; opacity: 0.85;">${item.name}</div>
            <div style="font-weight: 700; font-size: 13px; color: ${item.color}; margin-top: 2px;">
              ${item.value} users
            </div>
          `;
        },
      },
      xAxis: {
        type: 'value',
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            color: isDark ? '#1F1F1F' : '#F3F4F6',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: isDark ? '#8C8C8C' : '#6B7280',
          fontSize: 10.5,
        },
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLine: {
          show: true,
          lineStyle: { color: isDark ? '#262626' : '#E5E7EB' },
        },
        axisTick: { show: false },
        axisLabel: {
          color: isDark ? '#A1A1A1' : '#4B5563',
          fontSize: 11,
        },
      },
      series: [
        {
          name: 'Users',
          type: 'bar',
          data: values.map((val, idx) => ({
            value: val,
            itemStyle: {
              color: barColors[idx],
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barMaxWidth: 18,
          label: {
            show: true,
            position: 'right',
            color: isDark ? '#EDEDED' : '#16211B',
            fontSize: 11,
            fontWeight: 600,
          },
        },
      ],
    };
  }, [data, isDark]);

  return <ReactEChart option={option} height={210} />;
};

// ----------------------------------------------------
// 4. Financial Run-Rate Comparison (MRR vs ARR scale)
// ----------------------------------------------------
export const RevenueVelocityChart: React.FC<{ data?: SubscriptionReportMetrics }> = ({ data }) => {
  const { isDark } = useTheme();

  const mrr = data?.mrr ?? 0;
  const arr = data?.arr ?? 0;

  const option = useMemo<EChartsOption>(() => {
    return {
      backgroundColor: 'transparent',
      grid: {
        top: 24,
        right: 20,
        bottom: 8,
        left: 12,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: isDark ? '#1C1C1C' : '#16211B',
        borderColor: isDark ? '#2E2E2E' : '#16211B',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#ffffff', fontSize: 12 },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const item = params[0];
          return `
            <div style="font-weight: 600; font-size: 11.5px; opacity: 0.85;">${item.name}</div>
            <div style="font-weight: 700; font-size: 13px; color: ${item.color}; margin-top: 2px;">
              ${fmtRs(Number(item.value || 0))}
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: ['MRR (Monthly)', 'ARR (Annual Run-Rate)'],
        axisLine: {
          show: true,
          lineStyle: { color: isDark ? '#262626' : '#E5E7EB' },
        },
        axisTick: { show: false },
        axisLabel: {
          color: isDark ? '#A1A1A1' : '#4B5563',
          fontSize: 11,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: {
          lineStyle: {
            color: isDark ? '#1F1F1F' : '#F3F4F6',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: isDark ? '#8C8C8C' : '#6B7280',
          fontSize: 10.5,
          formatter: (value: number) => {
            if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
            if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
            if (value >= 1000) return `₹${Math.round(value / 1000)}k`;
            return `₹${value}`;
          },
        },
      },
      series: [
        {
          name: 'Revenue',
          type: 'bar',
          data: [
            {
              value: mrr,
              itemStyle: {
                color: '#22935A',
                borderRadius: [5, 5, 0, 0],
              },
            },
            {
              value: arr,
              itemStyle: {
                color: '#10B981',
                borderRadius: [5, 5, 0, 0],
              },
            },
          ],
          barMaxWidth: 44,
          label: {
            show: true,
            position: 'top',
            color: isDark ? '#EDEDED' : '#16211B',
            fontSize: 11,
            fontWeight: 600,
            formatter: (params: any) => fmtRs(Number(params.value || 0)),
          },
        },
      ],
    };
  }, [mrr, arr, isDark]);

  return <ReactEChart option={option} height={210} />;
};
