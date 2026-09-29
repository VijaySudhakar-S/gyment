'use client';

import React, { useState } from 'react';

interface RevenueChartProps {
  data?: number[];
  labels?: string[];
  height?: number;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data = [1240000, 1310000, 1275000, 1398000, 1450000, 1502000, 1560000, 1610000, 1690000],
  labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  height = 190,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const w = 560;
  const h = 190;
  const pad = 24;
  const max = Math.max(...data) * 1.15;
  const min = 0;
  const step = (w - pad * 2) / (data.length - 1);

  const pts = data.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return [x, y];
  });

  const path = pts
    .map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1))
    .join(' ');

  const area = `${path} L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;

  return (
    <div className="relative w-full overflow-hidden select-none" style={{ height }}>
      {/* Tooltip */}
      {hoverIndex !== null && (
        <div
          className="absolute z-20 pointer-events-none bg-gyment-dark text-white text-[11.5px] px-2.5 py-1.5 rounded-md shadow-lg font-semibold -translate-x-1/2 -translate-y-full transition-all duration-75"
          style={{
            left: `${(pts[hoverIndex][0] / w) * 100}%`,
            top: `${(pts[hoverIndex][1] / h) * 100 - 8}%`,
          }}
        >
          <div>{labels[hoverIndex]}</div>
          <div className="text-primary">
            ₹{Math.round(data[hoverIndex]).toLocaleString('en-IN')}
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
        {pts.map((p, i) => (
          <g key={i}>
            <circle
              cx={p[0]}
              cy={p[1]}
              r={hoverIndex === i ? 5 : 3}
              fill="#2FAE68"
              className="transition-all duration-100"
            />
            {/* Transparent hover hit target */}
            <circle
              cx={p[0]}
              cy={p[1]}
              r={16}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};
