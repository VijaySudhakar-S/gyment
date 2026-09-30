'use client';

import React, { useMemo } from 'react';
import { RevenueChartProps } from '@/types/charts';
import { ReactEChart } from './ReactEChart';
import { useTheme } from '@/context/ThemeContext';
import type { EChartsOption } from 'echarts';

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data = [],
  labels = [],
  height = 190,
}) => {
  const { isDark } = useTheme();

  const cleanData = useMemo(() => {
    return (data || []).map((v) => {
      const num = typeof v === 'number' ? v : Number(v);
      return Number.isNaN(num) || !Number.isFinite(num) ? 0 : num;
    });
  }, [data]);

  const option = useMemo<EChartsOption>(() => {
    return {
      backgroundColor: 'transparent',
      grid: {
        top: 24,
        right: 16,
        bottom: 12,
        left: 12,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
            type: 'dashed',
            width: 1.5,
          },
        },
        backgroundColor: isDark ? '#1C1C1C' : '#16211B',
        borderColor: isDark ? '#2E2E2E' : '#16211B',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: {
          color: '#ffffff',
          fontSize: 12,
          fontFamily: 'inherit',
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const item = params[0];
          const val = Number(item.value || 0).toLocaleString('en-IN');
          return `
            <div style="font-weight: 600; font-size: 11.5px; opacity: 0.85; margin-bottom: 4px;">
              ${item.name || 'Revenue'}
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; color: #34d399;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22935A;"></span>
              ₹${val}
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: labels.length > 0 ? labels : cleanData.map((_, i) => `M${i + 1}`),
        boundaryGap: false,
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
          margin: 10,
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
          name: 'Monthly Revenue',
          type: 'line',
          smooth: 0.35,
          showSymbol: true,
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#22935A',
            borderWidth: 2,
            borderColor: isDark ? '#141414' : '#ffffff',
          },
          lineStyle: {
            width: 2.8,
            color: '#22935A',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(34, 147, 90, 0.38)' },
                { offset: 0.8, color: 'rgba(34, 147, 90, 0.04)' },
                { offset: 1, color: 'rgba(34, 147, 90, 0.0)' },
              ],
            },
          },
          data: cleanData,
        },
      ],
    };
  }, [cleanData, labels, isDark]);

  if (!cleanData || cleanData.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full text-gyment-muted text-xs border border-dashed border-gyment-border rounded-lg"
        style={{ height }}
      >
        No revenue data available
      </div>
    );
  }

  return <ReactEChart option={option} height={height} />;
};
