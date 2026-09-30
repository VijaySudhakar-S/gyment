'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { StatCardProps } from '@/types/sharedComponents';

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  delta,
  deltaType = 'up',
  badge,
  className = '',
  onClick,
}) => {
  const deltaColors = {
    up: 'text-primary-dark',
    down: 'text-danger',
    neu: 'text-gyment-muted',
  };

  const badgeColors = {
    red: 'bg-red-50 text-red-600 border border-red-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    green: 'bg-green-50 text-green-700 border border-green-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
  };

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2, transition: { duration: 0.16, ease: 'easeOut' } }}
      className={`bg-white border border-gyment-border rounded-xl px-4 py-3.5 transition-shadow duration-150 hover:shadow-sm ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="text-xs text-gyment-muted font-semibold leading-normal">{label}</div>
      <div className="flex items-end gap-2 mt-1.5">
        <div className="text-xl font-extrabold text-gyment-text tracking-tight leading-tight">
          {value}
        </div>
        {badge && (
          <span className={`text-[10.5px] font-bold px-1.5 py-0.5 rounded-full mb-0.5 shrink-0 ${badgeColors[badge.color]}`}>
            {badge.text}
          </span>
        )}
      </div>
      {delta && (
        <div className={`text-xs mt-1 font-semibold ${deltaColors[deltaType]}`}>
          {delta}
        </div>
      )}
    </motion.div>
  );
};
