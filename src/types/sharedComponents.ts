import { HTMLMotionProps } from 'framer-motion';
import { ActivityItem } from '@/types/activity';
import React from 'react';

export interface TimelineProps {
  items: ActivityItem[];
  className?: string;
}

export type BadgeVariant = 'ok' | 'warn' | 'bad' | 'neu' | 'info';

export interface StatusBadgeProps {
  status?: string;
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: 'up' | 'down' | 'neu';
  className?: string;
  onClick?: () => void;
}

export interface MotionContainerProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}
