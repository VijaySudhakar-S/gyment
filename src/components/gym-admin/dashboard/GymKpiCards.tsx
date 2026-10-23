import React from 'react';
import { GymAdminDashboardStats } from '@/types/gymAdmin';
import { fmtRs } from '@/utils/gymAdminHelpers';
import { MotionStagger, MotionItem } from '@/components/shared/MotionContainer';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  CheckCircle2,
  ReceiptIndianRupee,
  TrendingUp,
  UserPlus,
} from 'lucide-react';

interface GymKpiCardsProps {
  stats: GymAdminDashboardStats | null;
  isLoading?: boolean;
}

export const GymKpiCards: React.FC<GymKpiCardsProps> = ({ stats, isLoading }) => {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gyment-border rounded-xl p-4 animate-pulse h-24"
          >
            <div className="h-3 w-20 bg-gyment-bg rounded mb-3" />
            <div className="h-6 w-16 bg-gyment-bg rounded mb-2" />
            <div className="h-2 w-24 bg-gyment-bg rounded" />
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Members',
      val: stats.totalMembers,
      delta: stats.totalMembersDelta || 'Active directory',
      isDown: false,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40',
    },
    {
      label: 'Active Members',
      val: stats.activeMembers,
      delta: stats.activeMembersDelta || 'Subscribed now',
      isDown: false,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Expiring Soon',
      val: stats.expiringSoon,
      delta: stats.expiringSoonDelta || 'Needs follow-up',
      isDown: true,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
    },
    {
      label: 'Expired Members',
      val: stats.expired,
      delta: stats.expiredDelta || 'Renewal opportunity',
      isDown: true,
      icon: UserX,
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40',
    },
    {
      label: "Today's Attendance",
      val: stats.todayAttendance,
      delta: stats.attendanceDelta || 'Checked in today',
      isDown: false,
      icon: CheckCircle2,
      color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40',
    },
    {
      label: "Today's Revenue",
      val: fmtRs(stats.todayRevenue),
      delta: stats.todayRevenueDelta || 'Collections today',
      isDown: false,
      icon: ReceiptIndianRupee,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'Monthly Revenue',
      val: fmtRs(stats.monthlyRevenue),
      delta: stats.monthlyRevenueDelta || 'This month total',
      isDown: false,
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      label: 'New Members (30d)',
      val: stats.newMembers30d,
      delta: stats.newMembersDelta || 'Last 30 days',
      isDown: false,
      icon: UserPlus,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
    },
  ];

  return (
    <MotionStagger className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {kpis.map((k, i) => {
        const Icon = k.icon;
        return (
          <MotionItem key={i}>
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="bg-white border border-gyment-border rounded-xl p-3.5 sm:p-4 hover:shadow-md transition-shadow cursor-default h-full"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-gyment-muted truncate">
                  {k.label}
                </span>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${k.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="text-2xl sm:text-[26px] font-extrabold text-gyment-text mt-2 tracking-tight truncate leading-tight">
                {k.val}
              </div>

              <div
                className={`text-xs font-semibold mt-1.5 truncate ${
                  k.isDown
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {k.delta}
              </div>
            </motion.div>
          </MotionItem>
        );
      })}
    </MotionStagger>
  );
};
