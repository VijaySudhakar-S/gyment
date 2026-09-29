'use client';

import React from 'react';

interface DonutItem {
  name: string;
  value: number;
  color: string;
}

interface SubscriptionDonutChartProps {
  data?: DonutItem[];
}

export const SubscriptionDonutChart: React.FC<SubscriptionDonutChartProps> = ({
  data = [
    { name: 'Starter', value: 48, color: '#8FA098' },
    { name: 'Growth', value: 37, color: '#2FAE68' },
    { name: 'Pro', value: 15, color: '#22935A' },
  ],
}) => {
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circ = 2 * Math.PI * r;

  const circles = data.reduce<{
    acc: number;
    items: Array<DonutItem & { dash: number; offset: number }>;
  }>(
    (res, item) => {
      const dash = (item.value / 100) * circ;
      const offset = circ - (res.acc / 100) * circ;
      return {
        acc: res.acc + item.value,
        items: [...res.items, { ...item, dash, offset }],
      };
    },
    { acc: 0, items: [] }
  ).items;

  return (
    <div className="flex items-center gap-5 flex-wrap py-2">
      <svg viewBox="0 0 140 140" width="140" height="140" className="shrink-0">
        {circles.map(c => (
          <circle
            key={c.name}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={c.color}
            strokeWidth={18}
            strokeDasharray={`${c.dash} ${circ - c.dash}`}
            strokeDashoffset={c.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-300"
          />
        ))}
      </svg>

      <div className="flex flex-col gap-2">
        {data.map(item => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <i
              className="w-2.5 h-2.5 rounded-sm inline-block shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <b className="text-gyment-text">{item.name}</b>
            <span className="text-gyment-muted">— {item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
