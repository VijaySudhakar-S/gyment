'use client';

import React from 'react';
import { SubscriptionComparisonBarChartProps } from '@/types/charts';

export const SubscriptionComparisonBarChart: React.FC<SubscriptionComparisonBarChartProps> = ({
  months = [],
  newSubs = [],
  cancelledSubs = [],
}) => {
  if (!months || months.length === 0 || !newSubs || newSubs.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-47.5 text-gyment-muted text-xs border border-dashed border-gyment-border rounded-lg">
        No subscription data available
      </div>
    );
  }

  const w = 300;
  const h = 190;
  const pad = 22;
  const gap = 14;
  const groups = newSubs.length;
  const gw = (w - pad * 2 - gap * (groups - 1)) / groups;
  const bw = gw / 2 - 2;
  const rawMax = Math.max(...newSubs, ...cancelledSubs, 0);
  const max = rawMax > 0 ? rawMax * 1.25 : 10;

  return (
    <div className="flex flex-col items-center select-none">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-47.5">
        {newSubs.map((valA, i) => {
          const valB = cancelledSubs[i] || 0;
          const gx = pad + i * (gw + gap);
          const ha = (valA / max) * (h - pad * 2);
          const hb = (valB / max) * (h - pad * 2);

          const safeY_a = h - pad - (Number.isNaN(ha) ? 0 : ha);
          const safeY_b = h - pad - (Number.isNaN(hb) ? 0 : hb);
          const safeH_a = Number.isNaN(ha) ? 0 : ha;
          const safeH_b = Number.isNaN(hb) ? 0 : hb;

          return (
            <g key={i}>
              {/* New Subs Bar (Green) */}
              <rect
                x={gx}
                y={safeY_a}
                width={bw}
                height={safeH_a}
                rx={3}
                fill="#2FAE68"
                className="transition-all duration-200"
              />
              {/* Cancelled Subs Bar (Red) */}
              <rect
                x={gx + bw + 2}
                y={safeY_b}
                width={bw}
                height={safeH_b}
                rx={3}
                fill="#C5432E"
                className="transition-all duration-200"
              />
              {/* Label */}
              <text
                x={gx + gw / 2}
                y={h - 6}
                fontSize={9}
                fill="#6E7A73"
                textAnchor="middle"
                className="font-medium"
              >
                {months[i]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend matching HTML prototype */}
      <div className="flex gap-3.5 text-[11.5px] text-gyment-muted mt-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5">
          <i className="w-2 h-2 rounded-xs bg-primary inline-block" />
          <span>New</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="w-2 h-2 rounded-xs bg-danger inline-block" />
          <span>Cancelled</span>
        </span>
      </div>
    </div>
  );
};
