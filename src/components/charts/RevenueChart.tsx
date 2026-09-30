'use client';

import React, { useState } from 'react';
import { RevenueChartProps } from '@/types/charts';

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data = [],
  labels = [],
  height = 190,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const cleanData = (data || []).map((v) => {
    const num = typeof v === 'number' ? v : Number(v);
    return Number.isNaN(num) || !Number.isFinite(num) ? 0 : num;
  });

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

  const w = 560;
  const h = 190;
  const pad = 24;

  const rawMax = Math.max(...cleanData, 0);
  const max = rawMax > 0 ? rawMax * 1.15 : 100;
  const min = 0;
  const step = cleanData.length > 1 ? (w - pad * 2) / (cleanData.length - 1) : 0;

  const pts: Array<[number, number]> = cleanData.map((v, i) => {
    const x = pad + i * step;
    const yRatio = max > min ? (v - min) / (max - min) : 0;
    const computedY = h - pad - yRatio * (h - pad * 2);
    const safeX = Number.isNaN(x) || !Number.isFinite(x) ? pad : x;
    const safeY = Number.isNaN(computedY) || !Number.isFinite(computedY) ? h - pad : computedY;
    return [safeX, safeY];
  });

  const path = pts
    .map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1))
    .join(' ');

  const lastPt = pts[pts.length - 1] || [w - pad, h - pad];
  const firstPt = pts[0] || [pad, h - pad];
  const area = `${path} L${lastPt[0].toFixed(1)},${h - pad} L${firstPt[0].toFixed(1)},${h - pad} Z`;

  return (
    <div className="relative w-full overflow-hidden select-none" style={{ height }}>
      {/* Tooltip */}
      {hoverIndex !== null && pts[hoverIndex] && (
        <div
          className="absolute z-20 pointer-events-none bg-gyment-dark text-white text-[11.5px] px-2.5 py-1.5 rounded-md shadow-lg font-semibold -translate-x-1/2 -translate-y-full transition-all duration-75"
          style={{
            left: `${((pts[hoverIndex][0] ?? pad) / w) * 100}%`,
            top: `${((pts[hoverIndex][1] ?? (h - pad)) / h) * 100 - 8}%`,
          }}
        >
          <div>{labels[hoverIndex] || `Month ${hoverIndex + 1}`}</div>
          <div className="text-primary">
            ₹{Math.round(cleanData[hoverIndex] || 0).toLocaleString('en-IN')}
          </div>
        </div>
      )}

      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="grad-revenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2FAE68" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2FAE68" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gradient Area Fill */}
        <path d={area} fill="url(#grad-revenue)" stroke="none" />

        {/* Main Line */}
        <path
          d={path}
          fill="none"
          stroke="#2FAE68"
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {pts.map((p, i) => {
          const cx = Number.isNaN(p[0]) || !Number.isFinite(p[0]) ? pad : p[0];
          const cy = Number.isNaN(p[1]) || !Number.isFinite(p[1]) ? h - pad : p[1];
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={hoverIndex === i ? 5 : 3}
                fill="#2FAE68"
                className="transition-all duration-100"
              />
              {/* Transparent hover hit target */}
              <circle
                cx={cx}
                cy={cy}
                r={16}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};
