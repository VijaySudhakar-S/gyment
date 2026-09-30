'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/context/ThemeContext';
import { SkeletonBlock } from '@/components/shared/skeletons';
import type { EChartsOption } from 'echarts';

// Dynamically import echarts-for-react to ensure pure client-side execution in Next.js App Router
const DynamicECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
  loading: () => <SkeletonBlock className="w-full h-full min-h-[190px] rounded-lg" />,
});

export interface ReactEChartProps {
  option: EChartsOption;
  height?: number | string;
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  notMerge?: boolean;
  lazyUpdate?: boolean;
  onEvents?: Record<string, (params: any) => void>;
}

export const ReactEChart: React.FC<ReactEChartProps> = ({
  option,
  height = 240,
  width = '100%',
  className = '',
  style,
  loading = false,
  notMerge = true,
  lazyUpdate = true,
  onEvents,
}) => {
  const { isDark } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ height, width, ...style }} className={className}>
        <SkeletonBlock className="w-full h-full rounded-lg" />
      </div>
    );
  }

  return (
    <div style={{ height, width, ...style }} className={`relative select-none ${className}`}>
      <DynamicECharts
        option={option}
        theme={isDark ? 'dark' : undefined}
        style={{ height: '100%', width: '100%' }}
        notMerge={notMerge}
        lazyUpdate={lazyUpdate}
        showLoading={loading}
        loadingOption={{
          text: '',
          color: '#22935A',
          textColor: isDark ? '#EDEDED' : '#16211B',
          maskColor: isDark ? 'rgba(20, 20, 20, 0.6)' : 'rgba(255, 255, 255, 0.6)',
        }}
        onEvents={onEvents}
      />
    </div>
  );
};
