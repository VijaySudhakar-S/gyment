import React from 'react';

export type BadgeVariant = 'ok' | 'warn' | 'bad' | 'neu' | 'info';

interface StatusBadgeProps {
  status?: string;
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  children,
  className = '',
}) => {
  let resolvedVariant: BadgeVariant = variant || 'neu';

  if (!variant && status) {
    switch (status) {
      case 'Active':
      case 'Resolved':
      case 'Enabled':
        resolvedVariant = 'ok';
        break;
      case 'Trial':
      case 'Open':
        resolvedVariant = 'info';
        break;
      case 'Past Due':
      case 'Important':
      case 'In Progress':
        resolvedVariant = 'warn';
        break;
      case 'Suspended':
      case 'Urgent':
        resolvedVariant = 'bad';
        break;
      case 'Cancelled':
      case 'Disabled':
      case 'Normal':
      default:
        resolvedVariant = 'neu';
        break;
    }
  }

  const variantStyles: Record<BadgeVariant, string> = {
    ok: 'bg-primary-light text-primary-dark',
    warn: 'bg-warning-light text-warning',
    bad: 'bg-danger-light text-danger',
    info: 'bg-info-light text-info',
    neu: 'bg-gyment-bg text-gyment-muted border border-gyment-border',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full leading-tight select-none ${variantStyles[resolvedVariant]} ${className}`}
    >
      {children || status}
    </span>
  );
};
