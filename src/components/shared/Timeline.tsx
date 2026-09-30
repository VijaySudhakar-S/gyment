import React from 'react';
import {
  Dumbbell,
  ArrowUp,
  AlertTriangle,
  Ban,
  HelpCircle,
  Users,
  IndianRupee,
  LogIn,
} from 'lucide-react';
import { ActivityItem, ActivityTone } from '@/types/activity';

import { TimelineProps } from '@/types/sharedComponents';

export const Timeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  const getIcon = (iconName: ActivityItem['icon']) => {
    switch (iconName) {
      case 'GYM':
        return <Dumbbell className="w-4 h-4" />;
      case 'UPGRADE':
        return <ArrowUp className="w-4 h-4" />;
      case 'WARN':
        return <AlertTriangle className="w-4 h-4" />;
      case 'BAN':
        return <Ban className="w-4 h-4" />;
      case 'SUPPORT':
        return <HelpCircle className="w-4 h-4" />;
      case 'USERS':
        return <Users className="w-4 h-4" />;
      case 'REVENUE':
        return <IndianRupee className="w-4 h-4" />;
      case 'LOGIN':
        return <LogIn className="w-4 h-4" />;
      default:
        return <Dumbbell className="w-4 h-4" />;
    }
  };

  const toneClasses: Record<ActivityTone, string> = {
    green: 'bg-primary-light text-primary-dark',
    blue: 'bg-info-light text-info',
    amber: 'bg-warning-light text-warning',
    red: 'bg-danger-light text-danger',
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {items.map((item, idx) => (
        <div
          key={item.id || idx}
          className="flex gap-3 py-3 border-b border-gyment-border  items-start"
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${toneClasses[item.tone]}`}
          >
            {getIcon(item.icon)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-gyment-text leading-snug">{item.t}</div>
            <div className="text-xs text-gyment-muted mt-0.5 leading-normal">{item.d}</div>
            <div className="text-[11px] text-gyment-muted mt-1">{item.ti}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
