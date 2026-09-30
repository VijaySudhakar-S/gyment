'use client';

import React, { useMemo } from 'react';
import { SubscriptionDonutChartProps } from '@/types/charts';
import { ReactEChart } from './ReactEChart';
import { useTheme } from '@/context/ThemeContext';
import type { EChartsOption } from 'echarts';

const DEFAULT_COLORS = [
  '#22935A', // Gyment primary
  '#34d399', // Emerald light
  '#10b981', // Emerald
  '#0d9488', // Teal
  '#065f46', // Dark emerald
  '#6ee7b7', // Mint
  '#3b82f6', // Accent blue
];

export const SubscriptionDonutChart: React.FC<SubscriptionDonutChartProps> = ({
  data = [],
  height = 190,
}) => {
  const { isDark } = useTheme();

  const cleanData = useMemo(() => {
    return (data || []).filter(item => typeof item.value === 'number' && item.value > 0);
  }, [data]);

  const total = useMemo(() => {
    return cleanData.reduce((acc, curr) => acc + curr.value, 0);
  }, [cleanData]);

  const option = useMemo<EChartsOption>(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
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
          return `
            <div style="font-weight: 600; font-size: 12px; margin-bottom: 3px;">
              ${params.name}
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #34d399;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${params.color};"></span>
              ${params.value} gyms (${params.percent}%)
            </div>
          `;
        },
      },
      legend: {
        orient: 'vertical',
        right: '4%',
        top: 'middle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
        icon: 'circle',
        textStyle: {
          color: isDark ? '#D1D5DB' : '#374151',
          fontSize: 11.5,
          fontWeight: 500,
        },
        formatter: (name: string) => {
          const item = cleanData.find(d => d.name === name);
          const percent = total > 0 && item ? Math.round((item.value / total) * 100) : 0;
          return `${name}  ${percent}%`;
        },
      },
      series: [
        {
          name: 'Subscriptions',
          type: 'pie',
          radius: ['52%', '78%'],
          center: ['34%', '50%'],
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
            scaleSize: 6,
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 700,
              color: isDark ? '#FFFFFF' : '#16211B',
              formatter: '{b}\n{d}%',
            },
          },
          labelLine: {
            show: false,
          },
          data: cleanData.map((d, i) => ({
            name: d.name,
            value: d.value,
            itemStyle: {
              color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
            },
          })),
        },
      ],
    };
  }, [cleanData, total, isDark]);

  if (!cleanData || cleanData.length === 0) {
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
