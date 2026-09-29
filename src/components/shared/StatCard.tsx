'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'up' | 'down' | 'neu';
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  delta,
  deltaType = 'up',
  className = '',
  onClick,
}) => {
  const deltaColors = {
    up: 'text-primary-dark',
    down: 'text-danger',
    neu: 'text-gyment-muted',
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
      <div className="text-xl font-extrabold text-gyment-text mt-1.5 tracking-tight leading-tight">
        {value}
      </div>
      {delta && (
        <div className={`text-xs mt-1 font-semibold ${deltaColors[deltaType]}`}>
          {delta}
        </div>
      )}
    </motion.div>
  );
};
