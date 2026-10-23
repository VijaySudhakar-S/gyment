import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { PrimaryButton } from '@/components/shared/PrimaryButton';

interface GymEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const GymEmptyState: React.FC<GymEmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`text-center py-12 px-4 flex flex-col items-center justify-center text-muted ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-3 text-stone-400">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h4 className="font-bold text-gyment-text text-sm mb-1">
        {title}
      </h4>
      <p className="text-xs text-muted max-w-sm mb-4 leading-relaxed">
        {description}
      </p>
      {action && (
        <PrimaryButton
          onClick={action.onClick}
        >
          {action.label}
        </PrimaryButton>
      )}
    </div>
  );
};
