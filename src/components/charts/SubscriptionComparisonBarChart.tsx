'use client';

import React from 'react';

interface SubscriptionComparisonBarChartProps {
  months?: string[];
  newSubs?: number[];
  cancelledSubs?: number[];
}

export const SubscriptionComparisonBarChart: React.FC<SubscriptionComparisonBarChartProps> = ({
  months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  newSubs = [8, 11, 9, 14, 12, 15],
  cancelledSubs = [2, 3, 1, 4, 2, 4],
}) => {
  const w = 300;
  const h = 190;
  const pad = 22;
  const gap = 14;
  const groups = newSubs.length;
  const gw = (w - pad * 2 - gap * (groups - 1)) / groups;
  const bw = gw / 2 - 2;
  const max = Math.max(...newSubs, ...cancelledSubs) * 1.25;

  return (
    <div className="flex flex-col items-center select-none">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-47.5">
        {newSubs.map((valA, i) => {
          const valB = cancelledSubs[i];
          const gx = pad + i * (gw + gap);
          const ha = (valA / max) * (h - pad * 2);
          const hb = (valB / max) * (h - pad * 2);

          return (
            <g key={i}>
              {/* New Subs Bar (Green) */}
              <rect
                x={gx}
                y={h - pad - ha}
                width={bw}
                height={ha}
                rx={3}
                fill="#2FAE68"
                className="transition-all duration-200"
              />
              {/* Cancelled Subs Bar (Red) */}
              <rect
                x={gx + bw + 2}
                y={h - pad - hb}
                width={bw}
                height={hb}
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
