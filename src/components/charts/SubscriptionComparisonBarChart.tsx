'use client';

import React, { useMemo } from 'react';
import { SubscriptionComparisonBarChartProps } from '@/types/charts';
import { ReactEChart } from './ReactEChart';
import { useTheme } from '@/context/ThemeContext';
import type { EChartsOption } from 'echarts';

export const SubscriptionComparisonBarChart: React.FC<SubscriptionComparisonBarChartProps> = ({
  months = [],
  newSubs = [],
  cancelledSubs = [],
  height = 190,
}) => {
  const { isDark } = useTheme();

  const option = useMemo<EChartsOption>(() => {
    return {
      backgroundColor: 'transparent',
      grid: {
        top: 32,
        right: 12,
        bottom: 8,
        left: 8,
        containLabel: true,
      },
      legend: {
        top: 0,
        right: 0,
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
        icon: 'roundRect',
        textStyle: {
          color: isDark ? '#D1D5DB' : '#374151',
          fontSize: 11,
          fontWeight: 500,
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: isDark ? '#1C1C1C' : '#16211B',
        borderColor: isDark ? '#2E2E2E' : '#16211B',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: {
          color: '#ffffff',
          fontSize: 12,
        },
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLine: {
          show: true,
          lineStyle: {
            color: isDark ? '#262626' : '#E5E7EB',
          },
        },
        axisTick: { show: false },
        axisLabel: {
          color: isDark ? '#8C8C8C' : '#6B7280',
          fontSize: 11,
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
          name: 'New Subscriptions',
          type: 'bar',
          data: newSubs,
          barMaxWidth: 14,
          itemStyle: {
            color: '#22935A',
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: 'Cancelled',
          type: 'bar',
          data: cancelledSubs,
          barMaxWidth: 14,
          itemStyle: {
            color: '#EF4444',
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [months, newSubs, cancelledSubs, isDark]);

  if (!months || months.length === 0 || !newSubs || newSubs.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full text-gyment-muted text-xs border border-dashed border-gyment-border rounded-lg"
        style={{ height }}
      >
        No subscription data available
      </div>
    );
  }

  return <ReactEChart option={option} height={height} />;
};
