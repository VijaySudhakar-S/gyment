'use client';

import React, { useMemo } from 'react';
import { ReactEChart } from '@/components/charts/ReactEChart';
import { useTheme } from '@/context/ThemeContext';
import type { EChartsOption } from 'echarts';

interface GymSvgBarChartProps {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}

export const GymSvgBarChart: React.FC<GymSvgBarChartProps> = ({
  data = [],
  labels = [],
  color = '#22935A',
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
          type: 'shadow',
        },
        backgroundColor: isDark ? '#1C1C1C' : '#FFFFFF',
        borderColor: isDark ? '#2E2E2E' : '#E3E8E5',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: {
          color: isDark ? '#ffffff' : '#16211B',
          fontSize: 12,
          fontFamily: 'inherit',
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const item = params[0];
          return `
            <div style="font-weight: 600; font-size: 11.5px; opacity: 0.85; margin-bottom: 4px; color: ${
              isDark ? '#A3A3A3' : '#6E7A73'
            };">
              ${item.name || 'Day'}
            </div>
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13px; color: #2FAE68;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22935A;"></span>
              ${item.value} check-ins
            </div>
          `;
        },
      },
      xAxis: {
        type: 'category',
        data: labels.length > 0 ? labels : cleanData.map((_, i) => `${i + 1}`),
        axisLine: {
          show: true,
          lineStyle: {
            color: isDark ? '#262626' : '#E3E8E5',
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
            color: isDark ? '#1F1F1F' : '#F0F3F1',
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
          name: 'Attendance',
          data: cleanData,
          type: 'bar',
          barWidth: '40%',
          itemStyle: {
            color: color,
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };
  }, [cleanData, labels, color, isDark]);

  if (!cleanData || cleanData.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full text-gyment-muted text-xs border border-dashed border-gyment-border rounded-lg"
        style={{ height }}
      >
        No attendance data available
      </div>
    );
  }

  return <ReactEChart option={option} height={height} />;
};
